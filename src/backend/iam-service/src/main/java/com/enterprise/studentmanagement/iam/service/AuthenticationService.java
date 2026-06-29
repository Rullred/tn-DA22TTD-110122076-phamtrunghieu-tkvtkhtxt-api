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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

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
            
            // Nếu chưa bị khóa, hiển thị số lần sai với cảnh báo
            String message;
            if (currentAttempts >= 16) {
                // 16-19 lần: Cảnh báo sắp bị chặn IP vĩnh viễn
                int remaining = 20 - currentAttempts;
                message = String.format("Tên đăng nhập hoặc mật khẩu không đúng (%d/20). CẢNH BÁO: Còn %d lần nữa IP sẽ bị chặn vĩnh viễn!", 
                        currentAttempts, remaining);
            } else if (currentAttempts >= 11) {
                // 11-15 lần: Cảnh báo sắp bị khóa 1 giờ
                int remaining = 15 - currentAttempts;
                message = String.format("Tên đăng nhập hoặc mật khẩu không đúng (%d/20). Còn %d lần nữa sẽ bị khóa 1 giờ.", 
                        currentAttempts, remaining);
            } else if (currentAttempts >= 6) {
                // 6-10 lần: Cảnh báo sắp bị khóa 1 phút
                int remaining = 10 - currentAttempts;
                message = String.format("Tên đăng nhập hoặc mật khẩu không đúng (%d/20). Còn %d lần nữa sẽ bị khóa 1 phút.", 
                        currentAttempts, remaining);
            } else {
                // 1-5 lần: Cảnh báo sắp bị khóa 30 giây
                int remaining = 5 - currentAttempts;
                message = String.format("Tên đăng nhập hoặc mật khẩu không đúng (%d/20). Còn %d lần nữa sẽ bị khóa 30 giây.", 
                        currentAttempts, remaining);
            }
            
            throw new UnauthorizedException(message);
        }

        // Reset failed login attempts on successful login
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(clientIp);
        userRepository.save(user);
        
        // Reset Redis counters
        failedLoginTrackingService.resetUserFailedAttempts(user.getUsername());
        failedLoginTrackingService.resetIpFailedAttempts(clientIp);

        // Log successful login
        securityLogService.logLoginSuccess(clientIp, user.getUsername(), null);
        
        log.info("User logged in successfully: {}", user.getUsername());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();

        // Save refresh token
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
