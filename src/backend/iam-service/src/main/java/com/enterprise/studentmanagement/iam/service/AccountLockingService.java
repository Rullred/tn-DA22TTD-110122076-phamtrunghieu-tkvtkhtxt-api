package com.enterprise.studentmanagement.iam.service;

import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Account Locking Service
 * Manages account locking with Redis-based temporary locks
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountLockingService {

    private final RedisTemplate<String, String> stringRedisTemplate;
    private final UserRepository userRepository;

    private static final String ACCOUNT_LOCK_PREFIX = "account_lock:";
    private static final int LOCK_THRESHOLD_1 = 5;  // First threshold - 30 seconds
    private static final int LOCK_THRESHOLD_2 = 10; // Second threshold - 1 minute
    private static final int LOCK_THRESHOLD_3 = 15; // Third threshold - 1 hour
    private static final int LOCK_THRESHOLD_4 = 20; // Fourth threshold - permanent IP block
    private static final Duration LOCK_DURATION_1 = Duration.ofSeconds(30);
    private static final Duration LOCK_DURATION_2 = Duration.ofMinutes(1);
    private static final Duration LOCK_DURATION_3 = Duration.ofHours(1);

    /**
     * Lock account temporarily in Redis
     * @param username Username to lock
     * @param duration Lock duration
     */
    public void lockAccount(String username, Duration duration) {
        String key = ACCOUNT_LOCK_PREFIX + username;
        String value = LocalDateTime.now().plus(duration).toString();
        
        stringRedisTemplate.opsForValue().set(key, value, duration);
        
        log.warn("Account locked in Redis: {} for {} minutes", username, duration.toMinutes());
    }

    /**
     * Lock account based on failed attempts
     * @param username Username to lock
     * @param failedAttempts Number of failed attempts
     */
    public void lockAccountByFailedAttempts(String username, int failedAttempts) {
        if (failedAttempts >= LOCK_THRESHOLD_3) {
            lockAccount(username, LOCK_DURATION_3);
            log.warn("Account locked for 1 hour after {} failed attempts: {}", failedAttempts, username);
        } else if (failedAttempts >= LOCK_THRESHOLD_2) {
            lockAccount(username, LOCK_DURATION_2);
            log.warn("Account locked for 1 minute after {} failed attempts: {}", failedAttempts, username);
        } else if (failedAttempts >= LOCK_THRESHOLD_1) {
            lockAccount(username, LOCK_DURATION_1);
            log.warn("Account locked for 30 seconds after {} failed attempts: {}", failedAttempts, username);
        }
    }

    /**
     * Check if account is locked in Redis
     * @param username Username to check
     * @return true if locked, false otherwise
     */
    public boolean isAccountLocked(String username) {
        String key = ACCOUNT_LOCK_PREFIX + username;
        String value = stringRedisTemplate.opsForValue().get(key);
        
        if (value != null) {
            LocalDateTime lockedUntil = LocalDateTime.parse(value);
            boolean isLocked = LocalDateTime.now().isBefore(lockedUntil);
            
            if (!isLocked) {
                // Lock expired, remove from Redis
                stringRedisTemplate.delete(key);
            }
            
            return isLocked;
        }
        
        return false;
    }

    /**
     * Get lock expiration time
     * @param username Username to check
     * @return LocalDateTime when lock expires, null if not locked
     */
    public LocalDateTime getLockExpiration(String username) {
        String key = ACCOUNT_LOCK_PREFIX + username;
        String value = stringRedisTemplate.opsForValue().get(key);
        
        if (value != null) {
            return LocalDateTime.parse(value);
        }
        
        return null;
    }

    /**
     * Get remaining lock time in seconds
     * @param username Username to check
     * @return Remaining seconds, 0 if not locked
     */
    public long getRemainingLockTime(String username) {
        String key = ACCOUNT_LOCK_PREFIX + username;
        Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    /**
     * Unlock account (remove from Redis and update database)
     * @param username Username to unlock
     */
    public void unlockAccount(String username) {
        // Remove from Redis
        String key = ACCOUNT_LOCK_PREFIX + username;
        stringRedisTemplate.delete(key);
        
        // Update database
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setIsLocked(false);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            log.info("Account unlocked: {}", username);
        });
    }

    /**
     * Unlock account by user ID (for admin operations)
     * @param userId User ID to unlock
     */
    public void unlockAccountById(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            unlockAccount(user.getUsername());
        });
    }

    /**
     * Permanently lock account in database
     * @param username Username to lock
     */
    public void permanentlyLockAccount(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setIsLocked(true);
            user.setLockedUntil(null); // null means permanent
            userRepository.save(user);
            log.warn("Account permanently locked: {}", username);
        });
    }

    /**
     * Check if account is locked (checks both Redis and database)
     * @param user User to check
     * @return true if locked, false otherwise
     */
    public boolean isUserLocked(User user) {
        // Check database for permanent lock
        if (user.getIsLocked() && user.getLockedUntil() == null) {
            return true;
        }
        
        // Check database for time-based lock
        if (user.isAccountLocked()) {
            return true;
        }
        
        // Check Redis for temporary lock
        return isAccountLocked(user.getUsername());
    }
}
