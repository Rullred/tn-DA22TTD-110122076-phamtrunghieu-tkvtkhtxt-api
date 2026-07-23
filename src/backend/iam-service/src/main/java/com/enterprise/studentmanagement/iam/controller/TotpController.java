package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.ApiResponse;
import com.enterprise.studentmanagement.iam.dto.AuthResponse;
import com.enterprise.studentmanagement.iam.dto.TotpSetupResponse;
import com.enterprise.studentmanagement.iam.dto.TotpVerifyRequest;
import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.exception.BadRequestException;
import com.enterprise.studentmanagement.iam.exception.UnauthorizedException;
import com.enterprise.studentmanagement.iam.repository.UserRepository;
import com.enterprise.studentmanagement.iam.security.JwtService;
import com.enterprise.studentmanagement.iam.service.SecurityLogService;
import com.enterprise.studentmanagement.iam.service.TotpService;
import com.enterprise.studentmanagement.iam.util.IpAddressUtil;
import dev.samstevens.totp.exceptions.QrGenerationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * REST Controller for TOTP (Google Authenticator) operations
 */
@RestController
@RequestMapping("/api/auth/totp")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TOTP Authentication", description = "Google Authenticator 2FA endpoints")
public class TotpController {

    private final TotpService totpService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final SecurityLogService securityLogService;
    private final StringRedisTemplate stringRedisTemplate;

    /**
     * Setup TOTP for current user
     * Returns QR code to scan with Google Authenticator
     */
    @PostMapping("/setup")
    @Operation(summary = "Setup TOTP 2FA", description = "Generate QR code for Google Authenticator")
    public ResponseEntity<ApiResponse<TotpSetupResponse>> setupTotp(
            @RequestHeader("Authorization") String authHeader) {
        
        // Extract token from Authorization header
        String token = authHeader.replace("Bearer ", "");
        
        // Parse token to get username
        io.jsonwebtoken.Claims claims = jwtService.getClaims(token);
        String username = claims.getSubject();
        
        log.info("TOTP setup request for user: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Người dùng không tồn tại"));

        try {
            // Generate new secret
            String secret = totpService.generateSecret();
            
            // Generate QR code
            String qrCodeDataUrl = totpService.generateQrCodeDataUrl(user.getEmail(), secret);
            
            // Save secret to user (but don't enable yet until verified)
            user.setTotpSecret(secret);
            user.setTotpEnabled(false); // Will be enabled after first successful verification
            userRepository.save(user);
            
            log.info("TOTP setup initiated for user: {}", username);
            
            TotpSetupResponse response = TotpSetupResponse.builder()
                    .secret(secret)
                    .qrCodeDataUrl(qrCodeDataUrl)
                    .manualEntryKey(formatSecretForManualEntry(secret))
                    .build();
            
            return ResponseEntity.ok(ApiResponse.success(response, "QR code đã được tạo thành công"));
            
        } catch (Exception e) {
            log.error("Failed to generate QR code for user {}: {}", username, e.getMessage());
            throw new BadRequestException("Không thể tạo mã QR. Vui lòng thử lại.");
        }
    }
    
    private String formatSecretForManualEntry(String secret) {
        // Format as XXXX-XXXX-XXXX-XXXX for easier manual entry
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < secret.length(); i++) {
            if (i > 0 && i % 4 == 0) {
                formatted.append("-");
            }
            formatted.append(secret.charAt(i));
        }
        return formatted.toString();
    }

    /**
     * Enable TOTP after scanning QR code
     * User must verify with a valid code to enable
     */
    @PostMapping("/enable")
    @Operation(summary = "Enable TOTP", description = "Verify and enable TOTP 2FA")
    public ResponseEntity<ApiResponse<String>> enableTotp(
            @RequestBody TotpVerifyRequest request,
            @RequestHeader("Authorization") String authHeader) {
        
        // Extract token from Authorization header
        String token = authHeader.replace("Bearer ", "");
        
        // Parse token to get username
        io.jsonwebtoken.Claims claims = jwtService.getClaims(token);
        String username = claims.getSubject();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Người dùng không tồn tại"));

        if (user.getTotpSecret() == null) {
            throw new BadRequestException("Chưa thiết lập TOTP. Vui lòng quét mã QR trước.");
        }

        // Verify the code
        if (!totpService.verifyCode(user.getTotpSecret(), request.getTotpCode())) {
            log.warn("Invalid TOTP code during enable for user: {}", username);
            throw new BadRequestException("Mã xác thực không đúng. Vui lòng thử lại.");
        }

        // Enable TOTP
        user.setTotpEnabled(true);
        userRepository.save(user);
        
        log.info("TOTP enabled successfully for user: {}", username);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Xác thực 2 yếu tố đã được bật thành công"));
    }

    /**
     * Disable TOTP
     */
    @PostMapping("/disable")
    @Operation(summary = "Disable TOTP", description = "Disable TOTP 2FA for current user")
    public ResponseEntity<ApiResponse<String>> disableTotp(
            @RequestHeader("Authorization") String authHeader) {
        
        // Extract token from Authorization header
        String token = authHeader.replace("Bearer ", "");
        
        // Parse token to get username
        io.jsonwebtoken.Claims claims = jwtService.getClaims(token);
        String username = claims.getSubject();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Người dùng không tồn tại"));

        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
        
        log.info("TOTP disabled for user: {}", username);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Xác thực 2 yếu tố đã được tắt"));
    }

    /**
     * Verify TOTP code during login
     */
    @PostMapping("/verify")
    @Operation(summary = "Verify TOTP code", description = "Verify TOTP code during login and get tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyTotp(
            @Valid @RequestBody TotpVerifyRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        log.info("TOTP verification request from IP: {}", clientIp);
        
        // Get username from temp token
        String tempTokenKey = "totp:tempToken:" + request.getTempToken();
        String username = stringRedisTemplate.opsForValue().get(tempTokenKey);
        
        if (username == null) {
            throw new BadRequestException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        
        // Get user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Người dùng không tồn tại"));
        
        if (!user.getTotpEnabled() || user.getTotpSecret() == null) {
            throw new BadRequestException("TOTP chưa được kích hoạt cho tài khoản này");
        }
        
        // Verify TOTP code
        if (!totpService.verifyCode(user.getTotpSecret(), request.getTotpCode())) {
            securityLogService.logLoginFailed(clientIp, username, "Mã TOTP không đúng", null);
            log.warn("Invalid TOTP code for user: {}", username);
            throw new BadRequestException("Mã xác thực không đúng. Vui lòng thử lại.");
        }
        
        // TOTP verified successfully!
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(clientIp);
        userRepository.save(user);
        
        // Delete temp token
        stringRedisTemplate.delete(tempTokenKey);
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();
        
        securityLogService.logLoginSuccess(clientIp, username, null);
        log.info("User logged in successfully via TOTP: {}", username);
        
        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }
}
