package com.enterprise.studentmanagement.iam.service;

import com.enterprise.studentmanagement.iam.config.JwtProperties;
import com.enterprise.studentmanagement.iam.dto.*;
import com.enterprise.studentmanagement.iam.entity.RefreshToken;
import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.exception.BadRequestException;
import com.enterprise.studentmanagement.iam.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.iam.exception.UnauthorizedException;
import com.enterprise.studentmanagement.iam.repository.RefreshTokenRepository;
import com.enterprise.studentmanagement.iam.repository.UserRepository;
import com.enterprise.studentmanagement.iam.security.JwtService;
import com.enterprise.studentmanagement.iam.util.TokenHasher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Authentication Service
 * Handles user registration, login, token refresh, and logout
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final FailedLoginTrackingService failedLoginTrackingService;
    private final AccountLockingService accountLockingService;
    private final IpBlacklistService ipBlacklistService;
    private final SecurityLogService securityLogService;
    private final TokenHasher tokenHasher;
    private final EmailService emailService;
    private final RedisTemplate<String, String> stringRedisTemplate;

    /**
     * API Gateway base URL reachable from the phone that scans the QR code.
     * The QR encodes {qrConfirmBaseUrl}/api/auth/qr-confirm?token=... so the
     * confirmation page is served by the backend, not the frontend dev server.
     */
    @Value("${app.qr.confirm-base-url:http://localhost:8080}")
    private String qrConfirmBaseUrl;
    
    // Self-injection để Spring tạo proxy cho @Transactional
    @Autowired
    @Lazy
    private AuthenticationService self;

    /**
     * Register a new user
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String clientIp) {
        log.info("Registering new user: {}", request.getUsername());

        // Validate username uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }

        // Validate email uniqueness
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại");
        }

        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .isLocked(false)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        
        // Log registration
        securityLogService.logRegistration(clientIp, user.getUsername(), null);
        
        log.info("User registered successfully: {}", user.getUsername());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();

        // Save refresh token
        saveRefreshToken(user.getId(), refreshToken);

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    /**
     * Login user and generate tokens
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String clientIp) {
        log.info("Login attempt for: {} from IP: {}", request.getUsernameOrEmail(), clientIp);

        // Check if IP is blocked
        if (ipBlacklistService.isIpBlocked(clientIp)) {
            securityLogService.logLoginFailed(clientIp, request.getUsernameOrEmail(), "IP bị chặn", null);
            throw new com.enterprise.studentmanagement.iam.exception.IpBlockedException(
                    "Địa chỉ IP của bạn đã bị chặn do hoạt động đáng ngờ");
        }

        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail())
                .orElseThrow(() -> {
                    // Increment IP failed attempts even if user not found
                    int ipAttempts = failedLoginTrackingService.incrementIpFailedAttempts(clientIp);
                    ipBlacklistService.blockIpIfThresholdExceeded(clientIp, ipAttempts);
                    
                    securityLogService.logLoginFailed(clientIp, request.getUsernameOrEmail(), 
                            "Người dùng không tồn tại", null);
                    
                    return new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không đúng");
                });

        // Check if account is locked (Redis or database)
        user.unlockIfExpired();
        if (accountLockingService.isUserLocked(user)) {
            long remainingSeconds = accountLockingService.getRemainingLockTime(user.getUsername());
            securityLogService.logLoginFailed(clientIp, user.getUsername(), 
                    "Tài khoản bị khóa", null);
            
            throw new com.enterprise.studentmanagement.iam.exception.AccountLockedException(
                    String.format("Tài khoản đã bị khóa. Vui lòng thử lại sau %d giây.", remainingSeconds));
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Tăng số lần sai trước
            int currentAttempts = user.getFailedLoginAttempts() + 1;
            
            // Gọi qua self để Spring tạo proxy và transaction hoạt động
            String lockMessage = self.handleFailedLogin(user, clientIp, currentAttempts);
            
            securityLogService.logLoginFailed(clientIp, user.getUsername(), 
                    "Mật khẩu không đúng", null);
            
            // Nếu có thông báo khóa, ném exception với thông báo khóa
            if (lockMessage != null) {
                throw new com.enterprise.studentmanagement.iam.exception.AccountLockedException(lockMessage);
            }
            
            // Nếu chưa bị khóa, hiển thị số lần sai với cảnh báo phân tầng (x/5)
            throw new UnauthorizedException(buildFailedLoginMessage(currentAttempts));
        }

        // ========================================
        // TOTP 2FA (Google Authenticator)
        // ========================================
        
        // Check if user has TOTP enabled
        if (user.getTotpEnabled() != null && user.getTotpEnabled()) {
            // User has TOTP enabled, require TOTP code
            String tempToken = UUID.randomUUID().toString();
            
            // Save temp session in Redis for 5 minutes
            String tempTokenKey = "totp:tempToken:" + tempToken;
            stringRedisTemplate.opsForValue().set(tempTokenKey, user.getUsername(), 5, TimeUnit.MINUTES);
            
            log.info("TOTP required for user: {}", user.getUsername());
            
            // Return response asking for TOTP
            return AuthResponse.builder()
                    .otpRequired(true)
                    .tempToken(tempToken)
                    .user(UserDto.fromEntity(user))
                    .build();
        }
        
        // User doesn't have TOTP enabled, proceed with normal login
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(clientIp);
        userRepository.save(user);

        // Reset IP tracking
        failedLoginTrackingService.resetIpFailedAttempts(clientIp);

        // Log success
        securityLogService.logLoginSuccess(clientIp, user.getUsername(), null);
        log.info("User logged in successfully (TOTP not enabled): {}", user.getUsername());

        // Generate tokens directly
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();

        // Return success response with tokens
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserDto.fromEntity(user))
                .otpRequired(false)
                .build();
    }

    /**
     * Verify OTP code and issue final tokens
     * DEPRECATED: Use TotpController.verifyTotp() instead for TOTP verification
     */
    @Deprecated
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request, String clientIp) {
        String tempToken = request.getTempToken();
        String otpCode = request.getOtpCode();
        
        log.info("Verifying OTP for tempToken: {} from IP: {}", tempToken, clientIp);
        
        String tempTokenKey = "otp:tempToken:" + tempToken;
        String username = stringRedisTemplate.opsForValue().get(tempTokenKey);
        
        if (username == null) {
            throw new BadRequestException("Phiên xác thực đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
        }
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
                
        // Check if user is locked
        user.unlockIfExpired();
        if (accountLockingService.isUserLocked(user)) {
            throw new com.enterprise.studentmanagement.iam.exception.AccountLockedException("Tài khoản đang bị khóa.");
        }
        
        // Check attempts
        String attemptsKey = "otp:attempts:" + username;
        String attemptsStr = stringRedisTemplate.opsForValue().get(attemptsKey);
        int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
        
        if (attempts >= 3) {
            // Remove OTP mapping to force login again
            stringRedisTemplate.delete(tempTokenKey);
            stringRedisTemplate.delete("otp:code:" + username);
            stringRedisTemplate.delete(attemptsKey);
            throw new BadRequestException("Bạn đã nhập sai OTP quá 3 lần. Vui lòng đăng nhập lại để nhận mã mới.");
        }
        
        String otpCodeKey = "otp:code:" + username;
        String storedOtp = stringRedisTemplate.opsForValue().get(otpCodeKey);
        
        if (storedOtp == null) {
            throw new BadRequestException("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng đăng nhập lại.");
        }
        
        if (!storedOtp.equals(otpCode)) {
            attempts++;
            stringRedisTemplate.opsForValue().set(attemptsKey, String.valueOf(attempts), 5, TimeUnit.MINUTES);
            int remaining = 3 - attempts;
            if (remaining <= 0) {
                stringRedisTemplate.delete(tempTokenKey);
                stringRedisTemplate.delete(otpCodeKey);
                stringRedisTemplate.delete(attemptsKey);
                throw new BadRequestException("Bạn đã nhập sai OTP quá 3 lần. Vui lòng đăng nhập lại để nhận mã mới.");
            }
            throw new BadRequestException("Mã OTP không chính xác. Bạn còn " + remaining + " lần nhập.");
        }
        
        // OTP matches: complete login process!
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(clientIp);
        userRepository.save(user);
        
        // Reset login fail tracking
        failedLoginTrackingService.resetUserFailedAttempts(username);
        failedLoginTrackingService.resetIpFailedAttempts(clientIp);
        
        // Delete OTP Redis keys
        stringRedisTemplate.delete(tempTokenKey);
        stringRedisTemplate.delete(otpCodeKey);
        stringRedisTemplate.delete(attemptsKey);
        
        // Log successful login
        securityLogService.logLoginSuccess(clientIp, username, null);
        
        log.info("User logged in successfully via OTP: {}", username);
        
        // Generate final tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();
        
        saveRefreshToken(user.getId(), refreshToken);
        
        return buildAuthResponse(accessToken, refreshToken, user);
    }

    /**
     * Refresh access token using refresh token
     */
    @Transactional
    public AuthResponse refreshToken(String refreshTokenString, String clientIp) {
        log.info("Refreshing access token from IP: {}", clientIp);

        // Find refresh token
        String refreshTokenHash = tokenHasher.hash(refreshTokenString);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(refreshTokenHash)
                .orElseThrow(() -> new UnauthorizedException("Token làm mới không hợp lệ"));

        // Validate refresh token
        if (!refreshToken.isValid()) {
            log.warn("Attempt to use invalid refresh token");
            throw new UnauthorizedException("Token làm mới đã hết hạn hoặc bị thu hồi");
        }

        // Find user
        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Check if account is locked
        user.unlockIfExpired();
        if (accountLockingService.isUserLocked(user)) {
            throw new UnauthorizedException("Tài khoản đã bị khóa");
        }

        // Generate new access token
        String accessToken = jwtService.generateAccessToken(user);

        // Log token refresh
        securityLogService.logTokenRefresh(clientIp, user.getUsername());
        
        log.info("Access token refreshed for user: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenString) // Return same refresh token
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtl().getSeconds())
                .user(UserDto.fromEntity(user))
                .build();
    }

    /**
     * Logout user and revoke refresh token
     */
    @Transactional
    public void logout(String refreshTokenString, String clientIp, String username) {
        log.info("Logging out user: {}", username);

        String refreshTokenHash = tokenHasher.hash(refreshTokenString);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(refreshTokenHash)
                .orElseThrow(() -> new UnauthorizedException("Token làm mới không hợp lệ"));

        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        // Log logout
        securityLogService.logLogout(clientIp, username);
        
        log.info("User logged out successfully: {}", username);
    }

    /**
     * Login with QR Code 2FA
     * Step 1: Validate username/password (with failed attempt tracking)
     * Step 2: If valid, return QR code (NOT tokens)
     * Step 3: User scans QR -> Polls /api/auth/qr-status -> Gets tokens
     */
    @Transactional
    public QrLoginResponse loginWithQr(LoginRequest request, String clientIp) {
        log.info("QR Login attempt for: {} from IP: {}", request.getUsernameOrEmail(), clientIp);

        // Check if IP is blocked
        if (ipBlacklistService.isIpBlocked(clientIp)) {
            securityLogService.logLoginFailed(clientIp, request.getUsernameOrEmail(), "IP bị chặn", null);
            throw new com.enterprise.studentmanagement.iam.exception.IpBlockedException(
                    "Địa chỉ IP của bạn đã bị chặn do hoạt động đáng ngờ");
        }

        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail())
                .orElseThrow(() -> {
                    // Increment IP failed attempts even if user not found
                    int ipAttempts = failedLoginTrackingService.incrementIpFailedAttempts(clientIp);
                    ipBlacklistService.blockIpIfThresholdExceeded(clientIp, ipAttempts);
                    
                    securityLogService.logLoginFailed(clientIp, request.getUsernameOrEmail(), 
                            "Người dùng không tồn tại", null);
                    
                    return new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không đúng");
                });

        // Check if account is locked (Redis or database)
        user.unlockIfExpired();
        if (accountLockingService.isUserLocked(user)) {
            long remainingSeconds = accountLockingService.getRemainingLockTime(user.getUsername());
            securityLogService.logLoginFailed(clientIp, user.getUsername(), 
                    "Tài khoản bị khóa", null);
            
            throw new com.enterprise.studentmanagement.iam.exception.AccountLockedException(
                    String.format("Tài khoản đã bị khóa. Vui lòng thử lại sau %d giây.", remainingSeconds));
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Tăng số lần sai trước
            int currentAttempts = user.getFailedLoginAttempts() + 1;
            
            // Gọi qua self để Spring tạo proxy và transaction hoạt động
            String lockMessage = self.handleFailedLogin(user, clientIp, currentAttempts);
            
            securityLogService.logLoginFailed(clientIp, user.getUsername(), 
                    "Mật khẩu không đúng", null);
            
            // Nếu có thông báo khóa, ném exception với thông báo khóa
            if (lockMessage != null) {
                throw new com.enterprise.studentmanagement.iam.exception.AccountLockedException(lockMessage);
            }
            
            // Nếu chưa bị khóa, hiển thị số lần sai với cảnh báo phân tầng (x/5)
            throw new UnauthorizedException(buildFailedLoginMessage(currentAttempts));
        }

        // Password is correct! Now generate QR code instead of tokens
        log.info("Password correct for user: {}. Generating QR code for 2FA", user.getUsername());
        
        // Generate unique login token
        String loginToken = UUID.randomUUID().toString();
        
        // Build confirmation link -> points to the backend (API Gateway) so the
        // phone opens a self-contained login page, not the frontend dev server.
        String confirmationLink = qrConfirmBaseUrl + "/api/auth/qr-confirm?token=" + loginToken;
        
        // Store in Redis with userId and username
        // Format: {userId}:{username}:PENDING
        String redisKey = "qr:login:" + loginToken;
        String redisValue = user.getId().toString() + ":" + user.getUsername() + ":PENDING";
        stringRedisTemplate.opsForValue().set(redisKey, redisValue, 120, TimeUnit.SECONDS);
        
        log.info("QR login token generated for user: {}, token: {}", user.getUsername(), loginToken);
        
        try {
            // Generate QR code image using ZXing (delegate to QrLoginService if needed)
            String qrCodeDataUrl = generateQrCodeImage(confirmationLink);
            
            return QrLoginResponse.builder()
                    .loginToken(loginToken)
                    .qrCodeDataUrl(qrCodeDataUrl)
                    .confirmationLink(confirmationLink)
                    .expiresIn(120L)
                    .instruction("Quét mã QR bằng camera điện thoại để hoàn tất đăng nhập")
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            throw new BadRequestException("Không thể tạo mã QR. Vui lòng thử lại.");
        }
    }
    
    /**
     * Generate QR code image as base64 data URL
     * Helper method for loginWithQr
     */
    private String generateQrCodeImage(String text) throws Exception {
        com.google.zxing.common.BitMatrix bitMatrix = new com.google.zxing.MultiFormatWriter()
                .encode(text, com.google.zxing.BarcodeFormat.QR_CODE, 300, 300);
        
        java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
        com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        
        byte[] imageBytes = outputStream.toByteArray();
        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
        
        return "data:image/png;base64," + base64Image;
    }

    /**
     * Build the "wrong credentials" warning message with a TIERED attempt
     * counter. Mỗi tầng khóa gồm 5 lần thử, nên bộ đếm được hiển thị theo tầng
     * hiện tại (1/5 → 5/5) thay vì đếm dồn liên tục (x/20). Sau mỗi lần khóa,
     * người dùng sang tầng kế tiếp và bộ đếm lại chạy từ 1/5.
     *   1-5   → còn ... lần sẽ bị khóa 30 giây
     *   6-10  → còn ... lần sẽ bị khóa 1 phút
     *   11-15 → còn ... lần sẽ bị khóa 1 giờ
     *   16-20 → CẢNH BÁO: còn ... lần IP sẽ bị chặn vĩnh viễn
     */
    private String buildFailedLoginMessage(int currentAttempts) {
        int inTier = ((currentAttempts - 1) % 5) + 1; // 1..5 trong tầng hiện tại
        int remaining = 5 - inTier;                    // số lần còn lại trước khi tầng này khóa

        String consequence;
        if (currentAttempts >= 16) {
            consequence = String.format("CẢNH BÁO: Còn %d lần nữa IP sẽ bị chặn vĩnh viễn!", remaining);
        } else if (currentAttempts >= 11) {
            consequence = String.format("Còn %d lần nữa sẽ bị khóa 1 giờ.", remaining);
        } else if (currentAttempts >= 6) {
            consequence = String.format("Còn %d lần nữa sẽ bị khóa 1 phút.", remaining);
        } else {
            consequence = String.format("Còn %d lần nữa sẽ bị khóa 30 giây.", remaining);
        }

        return String.format("Tên đăng nhập hoặc mật khẩu không đúng (%d/5). %s", inTier, consequence);
    }

    /**
     * Handle failed login attempt
     * @return Lock message if account is locked, null otherwise
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public String handleFailedLogin(User user, String clientIp, int currentAttempts) {
        // Increment Redis counters
        failedLoginTrackingService.incrementUserFailedAttempts(user.getUsername());
        int ipAttempts = failedLoginTrackingService.incrementIpFailedAttempts(clientIp);
        
        // Update database counter
        user.setFailedLoginAttempts(currentAttempts);

        String lockMessage = null;
        
        // Lock account based on failed attempts
        if (currentAttempts == 20) {
            // 20 lần → chặn IP vĩnh viễn + khóa tài khoản vĩnh viễn
            user.setIsLocked(true);
            user.setLockedUntil(null); // Khóa vĩnh viễn
            
            // Chặn IP vĩnh viễn
            ipBlacklistService.blockIpPermanently(clientIp, 
                    String.format("IP bị chặn vĩnh viễn sau %d lần xác thực sai. Chỉ Admin có thể mở khóa.", ipAttempts));
            securityLogService.logIpBlocked(clientIp, 
                    String.format("IP bị chặn vĩnh viễn sau %d lần xác thực sai", ipAttempts));
            
            securityLogService.logAccountLocked(clientIp, user.getUsername(), currentAttempts, -1);
            log.error("Tài khoản và IP bị chặn vĩnh viễn sau {} lần đăng nhập sai: {}", currentAttempts, user.getUsername());
            
            lockMessage = "Tài khoản đã bị khóa vĩnh viễn do vi phạm bảo mật nghiêm trọng. Vui lòng liên hệ Admin.";
            
        } else if (currentAttempts == 15) {
            // 15 lần → khóa 1 giờ
            user.setIsLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusHours(1));
            accountLockingService.lockAccount(user.getUsername(), Duration.ofHours(1));
            securityLogService.logAccountLocked(clientIp, user.getUsername(), currentAttempts, 60);
            log.warn("Tài khoản bị khóa 1 giờ sau {} lần đăng nhập sai: {}", currentAttempts, user.getUsername());
            
            lockMessage = "Bạn đã nhập sai mật khẩu 15 lần. Tài khoản đã bị khóa 1 giờ (3600 giây).";
            
        } else if (currentAttempts == 10) {
            // 10 lần → khóa 1 phút
            user.setIsLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(1));
            accountLockingService.lockAccount(user.getUsername(), Duration.ofMinutes(1));
            securityLogService.logAccountLocked(clientIp, user.getUsername(), currentAttempts, 1);
            log.warn("Tài khoản bị khóa 1 phút sau {} lần đăng nhập sai: {}", currentAttempts, user.getUsername());
            
            lockMessage = "Bạn đã nhập sai mật khẩu 10 lần. Tài khoản đã bị khóa 1 phút (60 giây).";
            
        } else if (currentAttempts == 5) {
            // 5 lần → khóa 30 giây
            user.setIsLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusSeconds(30));
            accountLockingService.lockAccount(user.getUsername(), Duration.ofSeconds(30));
            securityLogService.logAccountLocked(clientIp, user.getUsername(), currentAttempts, 0);
            log.warn("Tài khoản bị khóa 30 giây sau {} lần đăng nhập sai: {}", currentAttempts, user.getUsername());
            
            lockMessage = "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị khóa 30 giây.";
        }

        userRepository.save(user);
        
        return lockMessage;
    }

    /**
     * Admin đặt lại mật khẩu người dùng về mặc định + mở khóa tài khoản.
     * @return mật khẩu mặc định mới (để admin thông báo cho người dùng)
     */
    @Transactional
    public String resetPasswordToDefault(String usernameOrEmail) {
        final String defaultPassword = "Password@123";
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        user.setPasswordHash(passwordEncoder.encode(defaultPassword));
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);

        log.info("Admin reset password for user: {}", user.getUsername());
        return defaultPassword;
    }

    /**
     * Save refresh token to database
     */
    private void saveRefreshToken(UUID userId, String token) {
        LocalDateTime expiresAt = LocalDateTime.now().plus(jwtProperties.getRefreshTokenTtl());
        String tokenHash = tokenHasher.hash(token);

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    /**
     * Build authentication response
     */
    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtl().getSeconds())
                .user(UserDto.fromEntity(user))
                .build();
    }

    /**
     * Get username from JWT token (helper for logout)
     */
    public String getUsernameFromToken(String token) {
        return jwtService.getUsernameFromToken(token);
    }
}
