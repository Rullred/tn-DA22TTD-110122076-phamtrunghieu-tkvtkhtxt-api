package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.ApiResponse;
import com.enterprise.studentmanagement.iam.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Notification Controller (yêu cầu 1.1)
 * Trung tâm thông báo cho Admin: danh sách, số chưa đọc, đánh dấu đã đọc, tạo thông báo.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Trung tâm thông báo cho Admin")
public class NotificationController {

    private final NotificationService notificationService;

    /** Danh sách thông báo + số chưa đọc. */
    @GetMapping
    @Operation(summary = "Danh sách thông báo", description = "Kèm số thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false, defaultValue = "50") int limit) {
        List<Map<String, Object>> notifications = notificationService.list(limit);
        Map<String, Object> data = Map.of(
                "notifications", notifications,
                "unreadCount", notificationService.unreadCount());
        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách thông báo"));
    }

    /** Đánh dấu tất cả đã đọc. */
    @PostMapping("/read-all")
    @Operation(summary = "Đánh dấu đã đọc", description = "Đánh dấu toàn bộ thông báo là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đánh dấu tất cả là đã đọc"));
    }

    /** Tạo thông báo (dùng cho sự kiện nghiệp vụ từ service khác hoặc kiểm thử). */
    @PostMapping
    @Operation(summary = "Tạo thông báo", description = "Tạo thông báo thủ công / từ sự kiện nghiệp vụ")
    public ResponseEntity<ApiResponse<Void>> create(
            @RequestParam String type,
            @RequestParam(required = false, defaultValue = "MEDIUM") String severity,
            @RequestParam(required = false) String actor,
            @RequestParam String message,
            @RequestParam(required = false) String link) {
        notificationService.create(type, severity, actor, message, link);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã tạo thông báo"));
    }
}
