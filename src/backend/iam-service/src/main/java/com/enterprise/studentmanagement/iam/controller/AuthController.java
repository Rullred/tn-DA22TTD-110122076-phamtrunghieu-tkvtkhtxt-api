package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.*;
import com.enterprise.studentmanagement.iam.entity.UserRole;
import com.enterprise.studentmanagement.iam.security.JwtService;
import com.enterprise.studentmanagement.iam.service.AuthenticationService;
import com.enterprise.studentmanagement.iam.util.IpAddressUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles authentication endpoints: register, login, refresh, logout
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

    /**
     * Register a new user
     * POST /api/auth/register
     *
     * Bảo mật: chỉ ADMIN (gửi kèm token ADMIN) mới được tạo tài khoản TEACHER/ADMIN.
     * Người tự đăng ký công khai luôn bị ép về vai trò STUDENT — chống leo thang quyền.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest) {
        log.info("Register request received for username: {}", request.getUsername());

        // Ép vai trò STUDENT nếu người gọi KHÔNG phải admin đã xác thực
        if (request.getRole() != UserRole.STUDENT && !isAdminCaller(authHeader)) {
            log.warn("Non-admin caller requested role {} for '{}' -> forced to STUDENT",
                    request.getRole(), request.getUsername());
            request.setRole(UserRole.STUDENT);
        }

        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        AuthResponse response = authenticationService.register(request, clientIp);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
    }

    /**
     * Login user with QR code 2FA
     * POST /api/auth/login
     * 
     * Flow:
     * 1. Validate username/password (with failed attempt tracking)
     * 2. If valid -> Return QR code (NOT tokens)
     * 3. User scans QR -> Poll /api/auth/qr-status -> Get tokens
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        log.info("Login request received for: {}", request.getUsernameOrEmail());
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        
        // This now returns QR code instead of tokens directly
        Object response = authenticationService.loginWithQr(request, clientIp);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Vui lòng quét mã QR để hoàn tất đăng nhập"));
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        log.info("Token refresh request received");
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        AuthResponse response = authenticationService.refreshToken(request.getRefreshToken(), clientIp);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    /**
     * Logout user and revoke refresh token
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Logout request received");
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        
        // Extract username from JWT token if available
        String username = "unknown";
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                username = authenticationService.getUsernameFromToken(token);
            } catch (Exception e) {
                log.debug("Could not extract username from token: {}", e.getMessage());
            }
        }
        
        authenticationService.logout(request.getRefreshToken(), clientIp, username);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
    }

    /**
     * Verify OTP and get final tokens
     * POST /api/auth/verify-otp
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {
        log.info("OTP verification request received");
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        AuthResponse response = authenticationService.verifyOtp(request, clientIp);

        return ResponseEntity.ok(ApiResponse.success(response, "Xác thực OTP thành công"));
    }

    /**
     * Admin đặt lại mật khẩu người dùng về mặc định.
     * POST /api/auth/admin-reset-password  (yêu cầu token ADMIN)
     */
    @PostMapping("/admin-reset-password")
    public ResponseEntity<ApiResponse<String>> adminResetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (!isAdminCaller(authHeader)) {
            throw new com.enterprise.studentmanagement.iam.exception.UnauthorizedException(
                    "Chỉ quản trị viên mới được đặt lại mật khẩu");
        }

        String newPassword = authenticationService.resetPasswordToDefault(request.getUsernameOrEmail());

        return ResponseEntity.ok(ApiResponse.success(newPassword,
                "Đã đặt lại mật khẩu về mặc định: " + newPassword));
    }

    /**
     * Kiểm tra người gọi có phải ADMIN đã xác thực (token hợp lệ, role ADMIN).
     */
    private boolean isAdminCaller(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        String token = authHeader.substring(7);
        try {
            return jwtService.validateToken(token) && "ADMIN".equals(jwtService.getRoleFromToken(token));
        } catch (Exception e) {
            log.debug("Could not validate caller token: {}", e.getMessage());
            return false;
        }
    }
}
