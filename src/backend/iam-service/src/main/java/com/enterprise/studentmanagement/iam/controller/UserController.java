package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.ApiResponse;
import com.enterprise.studentmanagement.iam.dto.ChangePasswordRequest;
import com.enterprise.studentmanagement.iam.dto.UserDto;
import com.enterprise.studentmanagement.iam.service.UserService;
import com.enterprise.studentmanagement.iam.util.IpAddressUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * User Management Controller
 * Handles user-related endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get current user information
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("Get current user request for userId: {}", userId);
        
        UserDto user = userService.getUserById(userId);
        
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Change current user's password
     * PUT /api/users/me/password
     */
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        log.info("Change password request for userId: {}", userId);
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        userService.changePassword(userId, request, clientIp);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    /**
     * Unlock user account (ADMIN only)
     * POST /api/users/{id}/unlock
     */
    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unlockAccount(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID adminId,
            @RequestHeader("X-Username") String adminUsername,
            HttpServletRequest httpRequest) {
        log.info("Unlock account request for userId: {} by admin: {}", id, adminUsername);
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        userService.unlockAccount(id, adminUsername, clientIp);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Account unlocked successfully"));
    }

    /**
     * Remove IP from blacklist (ADMIN only)
     * DELETE /api/users/ip-blacklist/{ip}
     */
    @DeleteMapping("/ip-blacklist/{ip}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unblockIp(
            @PathVariable String ip,
            @RequestHeader("X-Username") String adminUsername,
            HttpServletRequest httpRequest) {
        log.info("Unblock IP request for: {} by admin: {}", ip, adminUsername);
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        userService.unblockIp(ip, adminUsername, clientIp);
        
        return ResponseEntity.ok(ApiResponse.success(null, "IP address unblocked successfully"));
    }
}
