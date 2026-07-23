package com.enterprise.studentmanagement.iam.service;

import com.enterprise.studentmanagement.iam.dto.QrLoginResponse;
import com.enterprise.studentmanagement.iam.dto.QrStatusResponse;
import com.enterprise.studentmanagement.iam.dto.UserResponse;
import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.exception.BadRequestException;
import com.enterprise.studentmanagement.iam.repository.UserRepository;
import com.enterprise.studentmanagement.iam.security.JwtService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service for QR Code Login
 * Allows users to login by scanning a QR code with their phone
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class QrLoginService {

    private final StringRedisTemplate stringRedisTemplate;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final FailedLoginTrackingService failedLoginTrackingService;

    @Value("${app.qr.confirm-base-url:http://localhost:8080}")
    private String qrConfirmBaseUrl;
    
    private static final int QR_CODE_SIZE = 300;
    private static final long QR_EXPIRY_SECONDS = 120; // 2 minutes
    private static final String QR_LOGIN_PREFIX = "qr:login:";

    /**
     * Generate QR code for login
     */
    public QrLoginResponse generateQrLogin(String userId, String username) {
        // Generate unique login token
        String loginToken = UUID.randomUUID().toString();

        // Build confirmation link -> backend (API Gateway) serves the confirm page
        String confirmationLink = qrConfirmBaseUrl + "/api/auth/qr-confirm?token=" + loginToken;
        
        // Store in Redis with userId
        String redisKey = QR_LOGIN_PREFIX + loginToken;
        String redisValue = userId + ":" + username + ":PENDING";
        stringRedisTemplate.opsForValue().set(redisKey, redisValue, QR_EXPIRY_SECONDS, TimeUnit.SECONDS);
        
        log.info("Generated QR login token for user: {}, token: {}", username, loginToken);
        
        try {
            // Generate QR code image
            String qrCodeDataUrl = generateQrCodeImage(confirmationLink);
            
            return QrLoginResponse.builder()
                    .loginToken(loginToken)
                    .qrCodeDataUrl(qrCodeDataUrl)
                    .confirmationLink(confirmationLink)
                    .expiresIn(QR_EXPIRY_SECONDS)
                    .instruction("Quét mã QR bằng camera điện thoại để đăng nhập")
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            throw new BadRequestException("Không thể tạo mã QR. Vui lòng thử lại.");
        }
    }

    /**
     * Check QR login status (for polling)
     */
    public QrStatusResponse checkQrStatus(String loginToken) {
        String redisKey = QR_LOGIN_PREFIX + loginToken;
        String value = stringRedisTemplate.opsForValue().get(redisKey);
        
        if (value == null) {
            // Token expired or doesn't exist
            return QrStatusResponse.builder()
                    .status("EXPIRED")
                    .build();
        }
        
        String[] parts = value.split(":");
        if (parts.length < 3) {
            return QrStatusResponse.builder()
                    .status("EXPIRED")
                    .build();
        }
        
        String userId = parts[0];
        String username = parts[1];
        String status = parts[2];
        
        if ("CONFIRMED".equals(status)) {
            // User confirmed on phone, generate tokens
            User user = userRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new BadRequestException("User not found"));
            
            // Generate JWT tokens
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken();
            
            // Đăng nhập thành công qua QR -> reset toàn bộ bộ đếm số lần sai,
            // đưa về trạng thái sạch giống luồng đăng nhập thường. Nếu không làm
            // bước này, failedLoginAttempts vẫn giữ giá trị cũ và cảnh báo (x/5)
            // tiếp tục hiển thị ở lần đăng nhập sau.
            user.setFailedLoginAttempts(0);
            user.setIsLocked(false);
            user.setLockedUntil(null);
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            // Xóa luôn counter trong Redis để lần sai kế tiếp bắt đầu lại từ 1/5
            failedLoginTrackingService.resetUserFailedAttempts(username);

            // Delete token from Redis (single use)
            stringRedisTemplate.delete(redisKey);
            
            log.info("QR login confirmed for user: {}", username);
            
            // Build user response manually
            UserResponse userResponse = new UserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    null, // roles - not used in QR login flow
                    user.getIsLocked() != null && user.getIsLocked(),
                    user.getLockedUntil() != null ? user.getLockedUntil().atZone(java.time.ZoneId.systemDefault()).toInstant() : null,
                    user.getLastLoginAt() != null ? user.getLastLoginAt().atZone(java.time.ZoneId.systemDefault()).toInstant() : null
            );
            
            return QrStatusResponse.builder()
                    .status("CONFIRMED")
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .user(userResponse)
                    .build();
        }
        
        // Still pending
        return QrStatusResponse.builder()
                .status("PENDING")
                .build();
    }

    /**
     * Confirm QR login from the phone.
     *
     * <p>Security: the person scanning the QR must re-authenticate with the
     * registered Gmail + password, and that account MUST be the same one that
     * started the login on the computer. Only then the login is confirmed.</p>
     *
     * @param loginToken     the QR token
     * @param usernameOrEmail credentials entered on the phone
     * @param rawPassword     credentials entered on the phone
     * @return the confirmed user's display name (for the success page)
     */
    public String confirmQrLoginWithCredentials(String loginToken, String usernameOrEmail, String rawPassword) {
        String redisKey = QR_LOGIN_PREFIX + loginToken;
        String value = stringRedisTemplate.opsForValue().get(redisKey);

        if (value == null) {
            throw new BadRequestException("Mã QR đã hết hạn hoặc không hợp lệ. Vui lòng tạo mã mới trên máy tính.");
        }

        String[] parts = value.split(":");
        if (parts.length < 3) {
            throw new BadRequestException("Dữ liệu phiên đăng nhập không hợp lệ.");
        }

        String pcUserId = parts[0];
        String pcUsername = parts[1];
        String status = parts[2];

        // Already confirmed once (single use)
        if ("CONFIRMED".equals(status)) {
            throw new BadRequestException("Mã QR này đã được xác nhận. Vui lòng quay lại máy tính.");
        }

        if (usernameOrEmail == null || usernameOrEmail.isBlank()
                || rawPassword == null || rawPassword.isBlank()) {
            throw new BadRequestException("Vui lòng nhập đầy đủ email và mật khẩu.");
        }

        // Authenticate the person scanning
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail.trim())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không đúng."));

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            throw new BadRequestException("Tài khoản của bạn đang bị khóa.");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            log.warn("QR confirm failed - wrong password for: {}", usernameOrEmail);
            throw new BadRequestException("Email hoặc mật khẩu không đúng.");
        }

        // The scanned account must match the account that started login on the PC
        if (!user.getId().toString().equals(pcUserId)) {
            log.warn("QR confirm rejected - account mismatch. PC user: {}, phone user: {}",
                    pcUsername, user.getUsername());
            throw new BadRequestException(
                    "Tài khoản này không khớp với phiên đăng nhập trên máy tính. "
                    + "Vui lòng đăng nhập đúng tài khoản đã bắt đầu trên máy tính.");
        }

        // All good -> mark CONFIRMED (browser polling will pick up the tokens)
        String newValue = pcUserId + ":" + pcUsername + ":CONFIRMED";
        stringRedisTemplate.opsForValue().set(redisKey, newValue, QR_EXPIRY_SECONDS, TimeUnit.SECONDS);

        log.info("QR login confirmed on phone by user: {}", user.getUsername());
        return user.getUsername();
    }

    /**
     * Generate QR code image as base64 data URL
     */
    private String generateQrCodeImage(String text) throws WriterException, IOException {
        BitMatrix bitMatrix = new MultiFormatWriter()
                .encode(text, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        
        byte[] imageBytes = outputStream.toByteArray();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        
        return "data:image/png;base64," + base64Image;
    }
}
