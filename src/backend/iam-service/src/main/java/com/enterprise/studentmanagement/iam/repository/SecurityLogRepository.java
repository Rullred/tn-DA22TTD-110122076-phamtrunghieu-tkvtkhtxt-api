package com.enterprise.studentmanagement.iam.repository;

import com.enterprise.studentmanagement.iam.entity.SecurityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Security Log Repository
 * Data access layer for SecurityLog entity
 */
@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, UUID> {

    /**
     * Find logs by username
     */
    Page<SecurityLog> findByUsername(String username, Pageable pageable);

    /**
     * Find logs by IP address
     */
    Page<SecurityLog> findByIpAddress(String ipAddress, Pageable pageable);

    /**
     * Find logs by action
     */
    Page<SecurityLog> findByAction(SecurityLog.SecurityAction action, Pageable pageable);

    /**
     * Find logs by result
     */
    Page<SecurityLog> findByResult(SecurityLog.SecurityResult result, Pageable pageable);

    /**
     * Find logs by username and action
     */
    List<SecurityLog> findByUsernameAndAction(String username, SecurityLog.SecurityAction action);

    /**
     * Find logs by IP address and action
     */
    List<SecurityLog> findByIpAddressAndAction(String ipAddress, SecurityLog.SecurityAction action);

    /**
     * Find logs within date range
     */
    @Query("SELECT sl FROM SecurityLog sl WHERE sl.createdAt BETWEEN :startDate AND :endDate ORDER BY sl.createdAt DESC")
    Page<SecurityLog> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Find failed login attempts for username
     */
    @Query("SELECT sl FROM SecurityLog sl WHERE sl.username = :username AND sl.action = 'LOGIN_FAILED' AND sl.createdAt > :since ORDER BY sl.createdAt DESC")
    List<SecurityLog> findRecentFailedLoginsByUsername(String username, LocalDateTime since);

    /**
     * Find failed login attempts for IP address
     */
    @Query("SELECT sl FROM SecurityLog sl WHERE sl.ipAddress = :ipAddress AND sl.action = 'LOGIN_FAILED' AND sl.createdAt > :since ORDER BY sl.createdAt DESC")
    List<SecurityLog> findRecentFailedLoginsByIp(String ipAddress, LocalDateTime since);

    /**
     * Count logs by action within time period
     */
    @Query("SELECT COUNT(sl) FROM SecurityLog sl WHERE sl.action = :action AND sl.createdAt > :since")
    long countByActionSince(SecurityLog.SecurityAction action, LocalDateTime since);

    /**
     * Delete old logs (for cleanup)
     */
    @Query("DELETE FROM SecurityLog sl WHERE sl.createdAt < :before")
    void deleteOldLogs(LocalDateTime before);
}
