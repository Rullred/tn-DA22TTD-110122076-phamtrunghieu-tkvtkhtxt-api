package com.enterprise.studentmanagement.iam.service;

import com.enterprise.studentmanagement.iam.dto.ChangePasswordRequest;
import com.enterprise.studentmanagement.iam.dto.UserDto;
import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.exception.BadRequestException;
import com.enterprise.studentmanagement.iam.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.iam.exception.UnauthorizedException;
import com.enterprise.studentmanagement.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User Service
 * Handles user management operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountLockingService accountLockingService;
    private final IpBlacklistService ipBlacklistService;
    private final SecurityLogService securityLogService;

    /**
     * Get user by ID
     */
    public UserDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return UserDto.fromEntity(user);
    }

    /**
     * Change user password
     */
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request, String clientIp) {
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        // Check if new password is same as current
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Log password change
        securityLogService.logPasswordChange(clientIp, user.getUsername());
        
        log.info("Password changed successfully for user: {}", user.getUsername());
    }

    /**
     * Unlock user account (ADMIN operation)
     */
    @Transactional
    public void unlockAccount(UUID userId, String adminUsername, String clientIp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Unlock account
        accountLockingService.unlockAccount(user.getUsername());

        // Log unlock event
        securityLogService.logAccountUnlocked(clientIp, user.getUsername(), adminUsername);
        
        log.info("Account unlocked for user: {} by admin: {}", user.getUsername(), adminUsername);
    }

    /**
     * Unblock IP address (ADMIN operation)
     */
    public void unblockIp(String ipAddress, String adminUsername, String clientIp) {
        // Check if IP is actually blocked
        if (!ipBlacklistService.isIpBlocked(ipAddress)) {
            throw new BadRequestException("IP address is not blocked");
        }

        // Unblock IP
        ipBlacklistService.unblockIp(ipAddress);

        // Log unblock event
        securityLogService.logIpUnblocked(ipAddress, adminUsername);
        
        log.info("IP address unblocked: {} by admin: {}", ipAddress, adminUsername);
    }

    /**
     * Get user by username
     */
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return UserDto.fromEntity(user);
    }

    /**
     * Check if user exists by username
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Check if user exists by email
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
