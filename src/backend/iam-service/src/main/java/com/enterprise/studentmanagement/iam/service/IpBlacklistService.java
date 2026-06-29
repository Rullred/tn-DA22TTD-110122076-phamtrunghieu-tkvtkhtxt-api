package com.enterprise.studentmanagement.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * IP Blacklist Service
 * Manages IP blacklist using Redis
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IpBlacklistService {

    private final RedisTemplate<String, String> stringRedisTemplate;

    private static final String IP_BLACKLIST_PREFIX = "ip_blacklist:";
    private static final int IP_BLOCK_THRESHOLD = 20; // Chặn IP vĩnh viễn sau 20 lần
    private static final long IP_BLOCK_DURATION_MINUTES = 60; // Không dùng nữa

    /**
     * Block an IP address permanently (chỉ Admin có thể mở)
     * @param ipAddress IP address to block
     * @param reason Reason for blocking
     */
    public void blockIpPermanently(String ipAddress, String reason) {
        String key = IP_BLACKLIST_PREFIX + ipAddress;
        String value = LocalDateTime.now().toString() + "|" + reason + "|PERMANENT";
        
        // Set without expiration (permanent block)
        stringRedisTemplate.opsForValue().set(key, value);
        
        log.warn("IP bị chặn vĩnh viễn: {} - Lý do: {}", ipAddress, reason);
    }

    /**
     * Block an IP address for 60 minutes (deprecated - không dùng nữa)
     * @param ipAddress IP address to block
     * @param reason Reason for blocking
     */
    @Deprecated
    public void blockIp(String ipAddress, String reason) {
        blockIpPermanently(ipAddress, reason);
    }

    /**
     * Block IP if failed attempts exceed threshold
     * @param ipAddress IP address to check
     * @param failedAttempts Number of failed attempts
     */
    public void blockIpIfThresholdExceeded(String ipAddress, int failedAttempts) {
        if (failedAttempts >= IP_BLOCK_THRESHOLD) {
            blockIp(ipAddress, "Exceeded " + IP_BLOCK_THRESHOLD + " failed login attempts");
        }
    }

    /**
     * Check if IP address is blocked
     * @param ipAddress IP address to check
     * @return true if blocked, false otherwise
     */
    public boolean isIpBlocked(String ipAddress) {
        String key = IP_BLACKLIST_PREFIX + ipAddress;
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }

    /**
     * Unblock an IP address
     * @param ipAddress IP address to unblock
     */
    public void unblockIp(String ipAddress) {
        String key = IP_BLACKLIST_PREFIX + ipAddress;
        Boolean deleted = stringRedisTemplate.delete(key);
        
        if (Boolean.TRUE.equals(deleted)) {
            log.info("IP address unblocked: {}", ipAddress);
        } else {
            log.warn("Attempted to unblock IP that was not blocked: {}", ipAddress);
        }
    }

    /**
     * Get block information for an IP address
     * @param ipAddress IP address to check
     * @return Block information (timestamp|reason), null if not blocked
     */
    public String getBlockInfo(String ipAddress) {
        String key = IP_BLACKLIST_PREFIX + ipAddress;
        return stringRedisTemplate.opsForValue().get(key);
    }

    /**
     * Get blocked timestamp for an IP address
     * @param ipAddress IP address to check
     * @return LocalDateTime when IP was blocked, null if not blocked
     */
    public LocalDateTime getBlockedTimestamp(String ipAddress) {
        String info = getBlockInfo(ipAddress);
        if (info != null && info.contains("|")) {
            String timestamp = info.split("\\|")[0];
            return LocalDateTime.parse(timestamp);
        }
        return null;
    }

    /**
     * Get block reason for an IP address
     * @param ipAddress IP address to check
     * @return Reason for blocking, null if not blocked
     */
    public String getBlockReason(String ipAddress) {
        String info = getBlockInfo(ipAddress);
        if (info != null && info.contains("|")) {
            return info.split("\\|", 2)[1];
        }
        return null;
    }

    /**
     * Get all blocked IP addresses
     * @return Set of blocked IP addresses
     */
    public Set<String> getAllBlockedIps() {
        Set<String> keys = stringRedisTemplate.keys(IP_BLACKLIST_PREFIX + "*");
        
        if (keys == null) {
            return Set.of();
        }
        
        return keys.stream()
                .map(key -> key.replace(IP_BLACKLIST_PREFIX, ""))
                .collect(Collectors.toSet());
    }

    /**
     * Get count of blocked IP addresses
     * @return Number of blocked IPs
     */
    public long getBlockedIpCount() {
        Set<String> keys = stringRedisTemplate.keys(IP_BLACKLIST_PREFIX + "*");
        return keys != null ? keys.size() : 0;
    }

    /**
     * Clear all blocked IP addresses (use with caution)
     */
    public void clearAllBlockedIps() {
        Set<String> keys = stringRedisTemplate.keys(IP_BLACKLIST_PREFIX + "*");
        
        if (keys != null && !keys.isEmpty()) {
            Long deleted = stringRedisTemplate.delete(keys);
            log.warn("Cleared all blocked IPs. Count: {}", deleted);
        }
    }
}
