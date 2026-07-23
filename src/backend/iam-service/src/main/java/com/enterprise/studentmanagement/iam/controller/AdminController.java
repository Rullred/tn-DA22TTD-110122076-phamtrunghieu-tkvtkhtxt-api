package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.ApiResponse;
import com.enterprise.studentmanagement.iam.service.IpBlacklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin Controller
 * Quản lý IP bị chặn: xem danh sách chi tiết, lịch sử, chặn/mở/sửa thủ công (yêu cầu 1.2).
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "API quản trị - chỉ dành cho Admin")
public class AdminController {

    private final IpBlacklistService ipBlacklistService;

    /**
     * Danh sách IP bị chặn (kèm chi tiết + thống kê).
     * GET /api/admin/blocked-ips
     */
    @GetMapping("/blocked-ips")
    @Operation(summary = "Lấy danh sách IP bị chặn", description = "Kèm metadata và IP bị chặn gần đây")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBlockedIps() {
        List<Map<String, Object>> detailed = ipBlacklistService.getAllBlockedDetails();
        long count = ipBlacklistService.getBlockedIpCount();

        Map<String, Object> data = Map.of(
                "blockedIps", ipBlacklistService.getAllBlockedIps(),   // giữ tương thích ngược
                "blockedIpsDetailed", detailed,
                "totalCount", count,
                "recentlyBlocked", detailed.size() > 5 ? detailed.subList(0, 5) : detailed
        );
        return ResponseEntity.ok(ApiResponse.success(data, String.format("Có %d IP đang bị chặn", count)));
    }

    /**
     * Lịch sử các lần chặn / mở chặn.
     * GET /api/admin/blocked-ips/history
     */
    @GetMapping("/blocked-ips/history")
    @Operation(summary = "Lịch sử chặn IP", description = "Danh sách sự kiện chặn/mở chặn gần nhất")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBlockHistory(
            @RequestParam(required = false, defaultValue = "100") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                ipBlacklistService.getHistory(limit), "Lịch sử chặn IP"));
    }

    /**
     * Chi tiết một IP bị chặn.
     * GET /api/admin/blocked-ips/{ip}
     */
    @GetMapping("/blocked-ips/{ip}")
    @Operation(summary = "Xem thông tin IP bị chặn", description = "Xem lý do, người chặn, thời hạn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBlockedIpInfo(@PathVariable String ip) {
        if (!ipBlacklistService.isIpBlocked(ip)) {
            return ResponseEntity.ok(ApiResponse.success(null, String.format("IP %s không bị chặn", ip)));
        }
        return ResponseEntity.ok(ApiResponse.success(
                ipBlacklistService.getBlockDetails(ip), String.format("Thông tin IP %s", ip)));
    }

    /**
     * Chặn IP thủ công (kèm người chặn + thời hạn).
     * POST /api/admin/blocked-ips
     */
    @PostMapping("/blocked-ips")
    @Operation(summary = "Chặn IP thủ công", description = "Admin chặn IP kèm lý do, người thực hiện, thời hạn (phút)")
    public ResponseEntity<ApiResponse<Void>> blockIpManually(
            @RequestParam String ip,
            @RequestParam(required = false, defaultValue = "Chặn thủ công bởi Admin") String reason,
            @RequestParam(required = false, defaultValue = "ADMIN") String blockedBy,
            @RequestParam(required = false, defaultValue = "0") long durationMinutes) {
        log.info("Admin {} chặn IP {} - Lý do: {} - Thời hạn: {} phút", blockedBy, ip, reason, durationMinutes);
        ipBlacklistService.blockIp(ip, reason, blockedBy, durationMinutes);
        return ResponseEntity.ok(ApiResponse.success(null, String.format("Đã chặn IP %s thành công", ip)));
    }

    /**
     * Sửa lý do / thời hạn chặn của một IP.
     * PUT /api/admin/blocked-ips/{ip}
     */
    @PutMapping("/blocked-ips/{ip}")
    @Operation(summary = "Sửa thông tin chặn IP", description = "Cập nhật lý do và/hoặc thời hạn chặn")
    public ResponseEntity<ApiResponse<Void>> editBlock(
            @PathVariable String ip,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false, defaultValue = "0") long durationMinutes) {
        boolean ok = ipBlacklistService.editBlock(ip, reason, durationMinutes);
        if (!ok) {
            return ResponseEntity.ok(ApiResponse.success(null, String.format("IP %s không bị chặn", ip)));
        }
        return ResponseEntity.ok(ApiResponse.success(null, String.format("Đã cập nhật thông tin chặn IP %s", ip)));
    }

    /**
     * Mở chặn IP.
     * DELETE /api/admin/blocked-ips/{ip}
     */
    @DeleteMapping("/blocked-ips/{ip}")
    @Operation(summary = "Mở khóa IP", description = "Admin mở khóa IP bị chặn")
    public ResponseEntity<ApiResponse<Void>> unblockIp(@PathVariable String ip) {
        if (!ipBlacklistService.isIpBlocked(ip)) {
            return ResponseEntity.ok(ApiResponse.success(null, String.format("IP %s không bị chặn", ip)));
        }
        ipBlacklistService.unblockIp(ip, "ADMIN");
        return ResponseEntity.ok(ApiResponse.success(null, String.format("Đã mở khóa IP %s thành công", ip)));
    }

    /**
     * Xóa tất cả IP bị chặn.
     * DELETE /api/admin/blocked-ips
     */
    @DeleteMapping("/blocked-ips")
    @Operation(summary = "Xóa tất cả IP bị chặn", description = "Cẩn thận! Xóa toàn bộ danh sách chặn")
    public ResponseEntity<ApiResponse<Void>> clearAllBlockedIps() {
        long count = ipBlacklistService.getBlockedIpCount();
        ipBlacklistService.clearAllBlockedIps();
        return ResponseEntity.ok(ApiResponse.success(null, String.format("Đã xóa %d IP bị chặn", count)));
    }
}
