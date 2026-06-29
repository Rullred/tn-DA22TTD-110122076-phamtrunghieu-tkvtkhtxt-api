package com.enterprise.studentmanagement.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Failed Login Tracking Service
 * Tracks failed login attempts using Redis with TTL
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FailedLoginTrackingService {

    private final RedisTemplate<String, String> stringRedisTemplate;

    private static final String FAILED_LOGIN_USER_PREFIX = "failed_login:user:";
    private static final String FAILED_LOGIN_IP_PREFIX = "failed_login:ip:";
    private static final Duration USER_FAILED_LOGIN_TTL = Duration.ofMinutes(30);
    private static final Duration IP_FAILED_LOGIN_TTL = Duration.ofHours(1);

    /**
     * Increment failed login counter for username
     * @param username Username that failed login
     * @return Current count of failed attempts
     */
    public int incrementUserFailedAttempts(String username) {
        String key = FAILED_LOGIN_USER_PREFIX + username;
        Long count = stringRedisTemplate.opsForValue().increment(key);
        
        if (count == null) {
            count = 0L;
        }
        
        // Set TTL on first increment
        if (count == 1) {
            stringRedisTemplate.expire(key, USER_FAILED_LOGIN_TTL);
        }
        
        log.debug("Failed login attempts for user {}: {}", username, count);
        return count.intValue();
    }

    /**
     * Increment failed login counter for IP address
     * @param ipAddress IP address that failed login
     * @return Current count of failed attempts
     */
    public int incrementIpFailedAttempts(String ipAddress) {
        String key = FAILED_LOGIN_IP_PREFIX + ipAddress;
        Long count = stringRedisTemplate.opsForValue().increment(key);
        
        if (count == null) {
            count = 0L;
        }
        
        // Set TTL on first increment
        if (count == 1) {
            stringRedisTemplate.expire(key, IP_FAILED_LOGIN_TTL);
        }
        
        log.debug("Failed login attempts for IP {}: {}", ipAddress, count);
        return count.intValue();
    }

    /**
     * Get failed login count for username
     * @param username Username to check
     * @return Number of failed attempts
     */
    public int getUserFailedAttempts(String username) {
        String key = FAILED_LOGIN_USER_PREFIX + username;
        String value = stringRedisTemplate.opsForValue().get(key);
        return value != null ? Integer.parseInt(value) : 0;
    }

    /**
     * Get failed login count for IP address
     * @param ipAddress IP address to check
     * @return Number of failed attempts
     */
    public int getIpFailedAttempts(String ipAddress) {
        String key = FAILED_LOGIN_IP_PREFIX + ipAddress;
        String value = stringRedisTemplate.opsForValue().get(key);
        return value != null ? Integer.parseInt(value) : 0;
    }

    /**
     * Reset failed login counter for username
     * @param username Username to reset
     */
    public void resetUserFailedAttempts(String username) {
        String key = FAILED_LOGIN_USER_PREFIX + username;
        stringRedisTemplate.delete(key);
        log.debug("Reset failed login attempts for user: {}", username);
    }

    /**
     * Reset failed login counter for IP address
     * @param ipAddress IP address to reset
     */
    public void resetIpFailedAttempts(String ipAddress) {
        String key = FAILED_LOGIN_IP_PREFIX + ipAddress;
        stringRedisTemplate.delete(key);
        log.debug("Reset failed login attempts for IP: {}", ipAddress);
    }

    /**
     * Get remaining TTL for user failed login counter
     * @param username Username to check
     * @return Remaining TTL in seconds, -1 if no TTL, -2 if key doesn't exist
     */
    public long getUserFailedAttemptsTTL(String username) {
        String key = FAILED_LOGIN_USER_PREFIX + username;
        Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null ? ttl : -2;
    }

    /**
     * Get remaining TTL for IP failed login counter
     * @param ipAddress IP address to check
     * @return Remaining TTL in seconds, -1 if no TTL, -2 if key doesn't exist
     */
    public long getIpFailedAttemptsTTL(String ipAddress) {
        String key = FAILED_LOGIN_IP_PREFIX + ipAddress;
        Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null ? ttl : -2;
    }
}
