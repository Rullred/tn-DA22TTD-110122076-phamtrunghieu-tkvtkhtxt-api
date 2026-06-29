package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.*;
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

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        log.info("Register request received for username: {}", request.getUsername());
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        AuthResponse response = authenticationService.register(request, clientIp);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
    }

    /**
     * Login user and get tokens
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        log.info("Login request received for: {}", request.getUsernameOrEmail());
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        AuthResponse response = authenticationService.login(request, clientIp);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
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
}
