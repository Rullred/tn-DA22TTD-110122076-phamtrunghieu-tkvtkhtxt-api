package com.enterprise.studentmanagement.iam.service;

import com.enterprise.studentmanagement.iam.entity.SecurityLog;
import com.enterprise.studentmanagement.iam.repository.SecurityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Security Log Service
 * Handles security event logging
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityLogService {

    private final SecurityLogRepository securityLogRepository;

    /**
     * Log a security event (async)
     */
    @Async
    @Transactional
    public void logSecurityEvent(
            String ipAddress,
            String username,
            SecurityLog.SecurityAction action,
            SecurityLog.SecurityResult result,
            String message,
            String userAgent) {
        
        SecurityLog securityLog = SecurityLog.builder()
                .ipAddress(ipAddress)
                .username(username)
                .action(action)
                .result(result)
                .message(message)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .build();

        securityLogRepository.save(securityLog);
        
        log.info("Security event logged: {} - {} - {} - {}", action, result, username, ipAddress);
    }

    /**
     * Log security event without user agent
     */
    @Async
    @Transactional
    public void logSecurityEvent(
            String ipAddress,
            String username,
            SecurityLog.SecurityAction action,
            SecurityLog.SecurityResult result,
            String message) {
        
        logSecurityEvent(ipAddress, username, action, result, message, null);
    }

    /**
     * Log successful login
     */
    public void logLoginSuccess(String ipAddress, String username, String userAgent) {
        logSecurityEvent(ipAddress, username, 
                SecurityLog.SecurityAction.LOGIN_SUCCESS, 
                SecurityLog.SecurityResult.SUCCESS,
                "User logged in successfully",
                userAgent);
    }

    /**
     * Log failed login
     */
    public void logLoginFailed(String ipAddress, String username, String reason, String userAgent) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.LOGIN_FAILED,
                SecurityLog.SecurityResult.FAILURE,
                "Login failed: " + reason,
                userAgent);
    }

    /**
     * Log account locked
     */
    public void logAccountLocked(String ipAddress, String username, int failedAttempts, int lockMinutes) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.ACCOUNT_LOCKED,
                SecurityLog.SecurityResult.WARNING,
                String.format("Account locked for %d minutes after %d failed attempts", lockMinutes, failedAttempts));
    }

    /**
     * Log account unlocked
     */
    public void logAccountUnlocked(String ipAddress, String username, String unlockedBy) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.ACCOUNT_UNLOCKED,
                SecurityLog.SecurityResult.INFO,
                "Account unlocked by: " + unlockedBy);
    }

    /**
     * Log IP blocked
     */
    public void logIpBlocked(String ipAddress, String reason) {
        logSecurityEvent(ipAddress, null,
                SecurityLog.SecurityAction.IP_BLOCKED,
                SecurityLog.SecurityResult.WARNING,
                "IP blocked: " + reason);
    }

    /**
     * Log IP unblocked
     */
    public void logIpUnblocked(String ipAddress, String unblockedBy) {
        logSecurityEvent(ipAddress, null,
                SecurityLog.SecurityAction.IP_UNBLOCKED,
                SecurityLog.SecurityResult.INFO,
                "IP unblocked by: " + unblockedBy);
    }

    /**
     * Log token refresh
     */
    public void logTokenRefresh(String ipAddress, String username) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.TOKEN_REFRESH,
                SecurityLog.SecurityResult.SUCCESS,
                "Access token refreshed");
    }

    /**
     * Log logout
     */
    public void logLogout(String ipAddress, String username) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.LOGOUT,
                SecurityLog.SecurityResult.SUCCESS,
                "User logged out");
    }

    /**
     * Log registration
     */
    public void logRegistration(String ipAddress, String username, String userAgent) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.REGISTRATION,
                SecurityLog.SecurityResult.SUCCESS,
                "New user registered",
                userAgent);
    }

    /**
     * Log password change
     */
    public void logPasswordChange(String ipAddress, String username) {
        logSecurityEvent(ipAddress, username,
                SecurityLog.SecurityAction.PASSWORD_CHANGED,
                SecurityLog.SecurityResult.SUCCESS,
                "Password changed successfully");
    }

    /**
     * Get logs by username
     */
    public Page<SecurityLog> getLogsByUsername(String username, Pageable pageable) {
        return securityLogRepository.findByUsername(username, pageable);
    }

    /**
     * Get logs by IP address
     */
    public Page<SecurityLog> getLogsByIpAddress(String ipAddress, Pageable pageable) {
        return securityLogRepository.findByIpAddress(ipAddress, pageable);
    }

    /**
     * Get logs by action
     */
    public Page<SecurityLog> getLogsByAction(SecurityLog.SecurityAction action, Pageable pageable) {
        return securityLogRepository.findByAction(action, pageable);
    }

    /**
     * Get logs within date range
     */
    public Page<SecurityLog> getLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return securityLogRepository.findByDateRange(startDate, endDate, pageable);
    }

    /**
     * Get recent failed logins for username
     */
    public List<SecurityLog> getRecentFailedLoginsByUsername(String username, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return securityLogRepository.findRecentFailedLoginsByUsername(username, since);
    }

    /**
     * Get recent failed logins for IP
     */
    public List<SecurityLog> getRecentFailedLoginsByIp(String ipAddress, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return securityLogRepository.findRecentFailedLoginsByIp(ipAddress, since);
    }

    /**
     * Clean up old logs (older than specified days)
     */
    @Transactional
    public void cleanupOldLogs(int daysToKeep) {
        LocalDateTime before = LocalDateTime.now().minusDays(daysToKeep);
        securityLogRepository.deleteOldLogs(before);
        log.info("Cleaned up security logs older than {} days", daysToKeep);
    }
}
