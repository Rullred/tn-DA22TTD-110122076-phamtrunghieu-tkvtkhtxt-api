package com.enterprise.studentmanagement.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * IP Blacklist Service
 * Quản lý danh sách IP bị chặn bằng Redis, kèm metadata (người chặn, thời hạn, lý do)
 * và lịch sử các lần chặn / mở chặn (phục vụ yêu cầu 1.2).
 *
 * Định dạng value: "timestamp|blockedBy|durationMinutes|reason" (reason ở cuối nên chứa được ký tự '|').
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IpBlacklistService {

    private final RedisTemplate<String, String> stringRedisTemplate;

    private static final String IP_BLACKLIST_PREFIX = "ip_blacklist:";
    private static final String IP_BLOCK_HISTORY_KEY = "ip_block_history";
    private static final int IP_BLOCK_THRESHOLD = 20; // Tự động chặn sau 20 lần đăng nhập sai
    private static final int HISTORY_MAX = 500;        // Giữ tối đa 500 sự kiện gần nhất

    // ==================== CHẶN / MỞ CHẶN ====================

    /**
     * Chặn IP với đầy đủ metadata.
     * @param durationMinutes thời hạn (phút); <= 0 nghĩa là chặn vĩnh viễn.
     */
    public void blockIp(String ipAddress, String reason, String blockedBy, long durationMinutes) {
        String safeReason = reason == null || reason.isBlank() ? "Không rõ lý do" : reason;
        String by = blockedBy == null || blockedBy.isBlank() ? "SYSTEM" : blockedBy;
        String value = String.join("|",
                LocalDateTime.now().toString(), by, String.valueOf(Math.max(0, durationMinutes)), safeReason);

        String key = IP_BLACKLIST_PREFIX + ipAddress;
        if (durationMinutes > 0) {
            stringRedisTemplate.opsForValue().set(key, value, durationMinutes, TimeUnit.MINUTES);
        } else {
            stringRedisTemplate.opsForValue().set(key, value);
        }
        appendHistory(ipAddress, "BLOCK", by, safeReason);
        log.warn("IP bị chặn: {} bởi {} - Lý do: {} - Thời hạn: {}", ipAddress, by,
                safeReason, durationMinutes > 0 ? durationMinutes + " phút" : "VĨNH VIỄN");
    }

    /** Chặn vĩnh viễn (giữ tương thích với code cũ). */
    public void blockIpPermanently(String ipAddress, String reason) {
        blockIp(ipAddress, reason, "SYSTEM", 0);
    }

    /** @deprecated dùng {@link #blockIp(String, String, String, long)}. */
    @Deprecated
    public void blockIp(String ipAddress, String reason) {
        blockIpPermanently(ipAddress, reason);
    }

    /** Tự động chặn nếu số lần đăng nhập sai vượt ngưỡng. */
    public void blockIpIfThresholdExceeded(String ipAddress, int failedAttempts) {
        if (failedAttempts >= IP_BLOCK_THRESHOLD) {
            blockIp(ipAddress, "Vượt " + IP_BLOCK_THRESHOLD + " lần đăng nhập sai", "SYSTEM", 0);
        }
    }

    public boolean isIpBlocked(String ipAddress) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(IP_BLACKLIST_PREFIX + ipAddress));
    }

    /** Mở chặn IP (mặc định do Admin thực hiện). */
    public void unblockIp(String ipAddress) {
        unblockIp(ipAddress, "ADMIN");
    }

    public void unblockIp(String ipAddress, String actor) {
        String key = IP_BLACKLIST_PREFIX + ipAddress;
        String reason = getBlockReason(ipAddress);
        Boolean deleted = stringRedisTemplate.delete(key);
        if (Boolean.TRUE.equals(deleted)) {
            appendHistory(ipAddress, "UNBLOCK", actor == null ? "ADMIN" : actor, reason);
            log.info("Đã mở chặn IP: {} bởi {}", ipAddress, actor);
        } else {
            log.warn("Mở chặn IP không tồn tại trong danh sách: {}", ipAddress);
        }
    }

    /** Cập nhật lý do / thời hạn của một IP đang bị chặn (giữ nguyên người chặn). */
    public boolean editBlock(String ipAddress, String reason, long durationMinutes) {
        if (!isIpBlocked(ipAddress)) return false;
        String by = getBlockedBy(ipAddress);
        String safeReason = reason == null || reason.isBlank() ? getBlockReason(ipAddress) : reason;
        String value = String.join("|",
                LocalDateTime.now().toString(), by, String.valueOf(Math.max(0, durationMinutes)), safeReason);
        String key = IP_BLACKLIST_PREFIX + ipAddress;
        if (durationMinutes > 0) {
            stringRedisTemplate.opsForValue().set(key, value, durationMinutes, TimeUnit.MINUTES);
        } else {
            stringRedisTemplate.opsForValue().set(key, value);
        }
        appendHistory(ipAddress, "EDIT", "ADMIN", safeReason);
        return true;
    }

    // ==================== ĐỌC METADATA ====================

    public String getBlockInfo(String ipAddress) {
        return stringRedisTemplate.opsForValue().get(IP_BLACKLIST_PREFIX + ipAddress);
    }

    private String[] parse(String info) {
        String[] out = new String[]{"", "", "0", ""};
        if (info == null) return out;
        String[] p = info.split("\\|", 4);
        for (int i = 0; i < p.length && i < 4; i++) out[i] = p[i];
        return out;
    }

    public LocalDateTime getBlockedTimestamp(String ipAddress) {
        String ts = parse(getBlockInfo(ipAddress))[0];
        try { return ts.isEmpty() ? null : LocalDateTime.parse(ts); } catch (Exception e) { return null; }
    }

    public String getBlockedBy(String ipAddress) {
        String v = parse(getBlockInfo(ipAddress))[1];
        return v.isEmpty() ? "SYSTEM" : v;
    }

    public long getDurationMinutes(String ipAddress) {
        try { return Long.parseLong(parse(getBlockInfo(ipAddress))[2]); } catch (Exception e) { return 0; }
    }

    public String getBlockReason(String ipAddress) {
        return parse(getBlockInfo(ipAddress))[3];
    }

    /** Chi tiết một IP bị chặn (phục vụ API). */
    public Map<String, Object> getBlockDetails(String ipAddress) {
        Map<String, Object> m = new LinkedHashMap<>();
        LocalDateTime blockedAt = getBlockedTimestamp(ipAddress);
        long duration = getDurationMinutes(ipAddress);
        m.put("ip", ipAddress);
        m.put("blockedAt", blockedAt);
        m.put("blockedBy", getBlockedBy(ipAddress));
        m.put("reason", getBlockReason(ipAddress));
        m.put("durationMinutes", duration);
        m.put("permanent", duration <= 0);
        m.put("expiresAt", duration > 0 && blockedAt != null ? blockedAt.plusMinutes(duration) : null);
        return m;
    }

    /** Danh sách chi tiết mọi IP bị chặn, mới nhất trước. */
    public List<Map<String, Object>> getAllBlockedDetails() {
        return getAllBlockedIps().stream()
                .map(this::getBlockDetails)
                .sorted((a, b) -> {
                    LocalDateTime ta = (LocalDateTime) a.get("blockedAt");
                    LocalDateTime tb = (LocalDateTime) b.get("blockedAt");
                    if (ta == null || tb == null) return 0;
                    return tb.compareTo(ta);
                })
                .collect(Collectors.toList());
    }

    public Set<String> getAllBlockedIps() {
        Set<String> keys = stringRedisTemplate.keys(IP_BLACKLIST_PREFIX + "*");
        if (keys == null) return Set.of();
        return keys.stream().map(k -> k.replace(IP_BLACKLIST_PREFIX, "")).collect(Collectors.toSet());
    }

    public long getBlockedIpCount() {
        return getAllBlockedIps().size();
    }

    public void clearAllBlockedIps() {
        Set<String> keys = stringRedisTemplate.keys(IP_BLACKLIST_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            stringRedisTemplate.delete(keys);
            appendHistory("*", "CLEAR_ALL", "ADMIN", "Xóa toàn bộ IP bị chặn");
            log.warn("Đã xóa toàn bộ IP bị chặn. Số lượng: {}", keys.size());
        }
    }

    // ==================== LỊCH SỬ CHẶN / MỞ CHẶN ====================

    private void appendHistory(String ip, String action, String actor, String reason) {
        String entry = String.join("|",
                LocalDateTime.now().toString(), action, ip,
                actor == null ? "" : actor,
                reason == null ? "" : reason.replace("|", "/"));
        stringRedisTemplate.opsForList().rightPush(IP_BLOCK_HISTORY_KEY, entry);
        stringRedisTemplate.opsForList().trim(IP_BLOCK_HISTORY_KEY, -HISTORY_MAX, -1);
    }

    /** Lịch sử gần nhất, mới nhất trước. */
    public List<Map<String, Object>> getHistory(int limit) {
        List<String> raw = stringRedisTemplate.opsForList().range(IP_BLOCK_HISTORY_KEY, 0, -1);
        List<Map<String, Object>> out = new ArrayList<>();
        if (raw == null) return out;
        for (int i = raw.size() - 1; i >= 0 && out.size() < limit; i--) {
            String[] p = raw.get(i).split("\\|", 5);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("at", p.length > 0 ? p[0] : "");
            m.put("action", p.length > 1 ? p[1] : "");
            m.put("ip", p.length > 2 ? p[2] : "");
            m.put("actor", p.length > 3 ? p[3] : "");
            m.put("reason", p.length > 4 ? p[4] : "");
            out.add(m);
        }
        return out;
    }
}
