package com.enterprise.studentmanagement.hr.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Đẩy thông báo cho Admin vào Redis dùng chung (cùng key/format với iam-service NotificationService).
 * hr-service chỉ TẠO thông báo (vd: có đề xuất mở môn học mới); iam-service phục vụ đọc/đánh dấu.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RedisTemplate<String, String> stringRedisTemplate;

    private static final String KEY = "admin_notifications";
    private static final int MAX = 200;

    /** Định dạng entry PHẢI khớp iam-service: "createdAt|type|severity|actor|link|message". */
    public void create(String type, String severity, String actor, String message, String link) {
        String entry = String.join("|",
                LocalDateTime.now().toString(),
                type == null || type.isBlank() ? "SYSTEM" : type,
                severity == null || severity.isBlank() ? "MEDIUM" : severity,
                actor == null ? "" : actor.replace("|", "/"),
                link == null ? "" : link.replace("|", "/"),
                message == null ? "" : message.replace("|", "/"));
        try {
            stringRedisTemplate.opsForList().leftPush(KEY, entry);
            stringRedisTemplate.opsForList().trim(KEY, 0, MAX - 1);
            log.info("Thông báo mới [{}/{}]: {}", type, severity, message);
        } catch (Exception e) {
            // Thông báo là best-effort: không để lỗi Redis làm hỏng nghiệp vụ chính.
            log.warn("Không đẩy được thông báo tới Redis: {}", e.getMessage());
        }
    }
}
