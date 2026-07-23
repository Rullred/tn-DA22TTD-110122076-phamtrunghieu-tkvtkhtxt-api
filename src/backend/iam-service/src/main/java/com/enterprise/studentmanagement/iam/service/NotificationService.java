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

/**
 * Notification Service (yêu cầu 1.1 - Trung tâm thông báo cho Admin)
 * Lưu thông báo trong Redis (dùng chung giữa các service), không dùng dữ liệu demo.
 *
 * Định dạng entry: "createdAt|type|severity|actor|link|message" (message ở cuối).
 * Trạng thái đã đọc theo mốc thời gian "đọc gần nhất" (admin_notifications_last_read).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RedisTemplate<String, String> stringRedisTemplate;

    private static final String KEY = "admin_notifications";
    private static final String LAST_READ_KEY = "admin_notifications_last_read";
    private static final int MAX = 200;

    /**
     * Tạo một thông báo.
     * @param type      SUBJECT_APPROVAL | ACCOUNT_PENDING | ABNORMAL_TRAFFIC | ATTACK | SECURITY | SYSTEM
     * @param severity  LOW | MEDIUM | HIGH | CRITICAL
     * @param actor     người/đối tượng liên quan (có thể null)
     * @param message   nội dung
     * @param link      đường dẫn xử lý trực tiếp (có thể null)
     */
    public void create(String type, String severity, String actor, String message, String link) {
        String entry = String.join("|",
                LocalDateTime.now().toString(),
                safe(type, "SYSTEM"),
                safe(severity, "MEDIUM"),
                actor == null ? "" : actor.replace("|", "/"),
                link == null ? "" : link.replace("|", "/"),
                message == null ? "" : message.replace("|", "/"));
        stringRedisTemplate.opsForList().leftPush(KEY, entry);
        stringRedisTemplate.opsForList().trim(KEY, 0, MAX - 1);
        log.info("Thông báo mới [{}/{}]: {}", type, severity, message);
    }

    /** Danh sách thông báo mới nhất trước, kèm cờ đã đọc. */
    public List<Map<String, Object>> list(int limit) {
        List<String> raw = stringRedisTemplate.opsForList().range(KEY, 0, limit - 1);
        List<Map<String, Object>> out = new ArrayList<>();
        if (raw == null) return out;
        LocalDateTime lastRead = getLastRead();
        for (String r : raw) {
            String[] p = r.split("\\|", 6);
            String at = p.length > 0 ? p[0] : "";
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("at", at);
            m.put("type", p.length > 1 ? p[1] : "");
            m.put("severity", p.length > 2 ? p[2] : "");
            m.put("actor", p.length > 3 ? p[3] : "");
            m.put("link", p.length > 4 ? p[4] : "");
            m.put("message", p.length > 5 ? p[5] : "");
            boolean read = false;
            try {
                read = lastRead != null && !at.isEmpty() && !LocalDateTime.parse(at).isAfter(lastRead);
            } catch (Exception ignored) { }
            m.put("read", read);
            out.add(m);
        }
        return out;
    }

    /** Số thông báo chưa đọc. */
    public long unreadCount() {
        List<String> raw = stringRedisTemplate.opsForList().range(KEY, 0, -1);
        if (raw == null) return 0;
        LocalDateTime lastRead = getLastRead();
        if (lastRead == null) return raw.size();
        long count = 0;
        for (String r : raw) {
            String at = r.split("\\|", 2)[0];
            try { if (LocalDateTime.parse(at).isAfter(lastRead)) count++; } catch (Exception ignored) { }
        }
        return count;
    }

    /** Đánh dấu tất cả đã đọc (đặt mốc thời gian đọc = hiện tại). */
    public void markAllRead() {
        stringRedisTemplate.opsForValue().set(LAST_READ_KEY, LocalDateTime.now().toString());
    }

    private LocalDateTime getLastRead() {
        String v = stringRedisTemplate.opsForValue().get(LAST_READ_KEY);
        try { return v == null ? null : LocalDateTime.parse(v); } catch (Exception e) { return null; }
    }

    private String safe(String v, String def) {
        return v == null || v.isBlank() ? def : v;
    }
}
