package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.ApiResponse;
import com.enterprise.studentmanagement.iam.service.IpBlacklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Admin Controller
 * Các chức năng dành cho Admin: mở khóa IP, xem danh sách IP bị chặn, v.v.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "API quản trị - chỉ dành cho Admin")
public class AdminController {

    private final IpBlacklistService ipBlacklistService;

    /**
     * Lấy danh sách tất cả IP bị chặn
     * GET /api/admin/blocked-ips
     */
    @GetMapping("/blocked-ips")
    @Operation(summary = "Lấy danh sách IP bị chặn", description = "Chỉ Admin mới có quyền xem")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBlockedIps() {
        log.info("Admin đang xem danh sách IP bị chặn");
        
        Set<String> blockedIps = ipBlacklistService.getAllBlockedIps();
        long count = ipBlacklistService.getBlockedIpCount();
        
        Map<String, Object> data = new HashMap<>();
        data.put("blockedIps", blockedIps);
        data.put("totalCount", count);
        
        return ResponseEntity.ok(ApiResponse.success(data, 
                String.format("Có %d IP đang bị chặn", count)));
    }

    /**
     * Xem thông tin chi tiết của một IP bị chặn
     * GET /api/admin/blocked-ips/{ip}
     */
    @GetMapping("/blocked-ips/{ip}")
    @Operation(summary = "Xem thông tin IP bị chặn", description = "Xem lý do và thời gian chặn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBlockedIpInfo(@PathVariable String ip) {
        log.info("Admin đang xem thông tin IP bị chặn: {}", ip);
        
        if (!ipBlacklistService.isIpBlocked(ip)) {
            return ResponseEntity.ok(ApiResponse.success(null, 
                    String.format("IP %s không bị chặn", ip)));
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("ip", ip);
        data.put("blockedAt", ipBlacklistService.getBlockedTimestamp(ip));
        data.put("reason", ipBlacklistService.getBlockReason(ip));
        data.put("isBlocked", true);
        
        return ResponseEntity.ok(ApiResponse.success(data, 
                String.format("Thông tin IP %s", ip)));
    }

    /**
     * Mở khóa IP (chỉ Admin)
     * DELETE /api/admin/blocked-ips/{ip}
     */
    @DeleteMapping("/blocked-ips/{ip}")
    @Operation(summary = "Mở khóa IP", description = "Chỉ Admin mới có quyền mở khóa IP bị chặn vĩnh viễn")
    public ResponseEntity<ApiResponse<Void>> unblockIp(@PathVariable String ip) {
        log.info("Admin đang mở khóa IP: {}", ip);
        
        if (!ipBlacklistService.isIpBlocked(ip)) {
            return ResponseEntity.ok(ApiResponse.success(null, 
                    String.format("IP %s không bị chặn", ip)));
        }
        
        ipBlacklistService.unblockIp(ip);
        
        return ResponseEntity.ok(ApiResponse.success(null, 
                String.format("Đã mở khóa IP %s thành công", ip)));
    }

    /**
     * Xóa tất cả IP bị chặn (cẩn thận!)
     * DELETE /api/admin/blocked-ips
     */
    @DeleteMapping("/blocked-ips")
    @Operation(summary = "Xóa tất cả IP bị chặn", description = "Cẩn thận! Thao tác này sẽ xóa tất cả IP bị chặn")
    public ResponseEntity<ApiResponse<Void>> clearAllBlockedIps() {
        log.warn("Admin đang xóa TẤT CẢ IP bị chặn");
        
        long count = ipBlacklistService.getBlockedIpCount();
        ipBlacklistService.clearAllBlockedIps();
        
        return ResponseEntity.ok(ApiResponse.success(null, 
                String.format("Đã xóa %d IP bị chặn", count)));
    }

    /**
     * Chặn IP thủ công (Admin)
     * POST /api/admin/blocked-ips
     */
    @PostMapping("/blocked-ips")
    @Operation(summary = "Chặn IP thủ công", description = "Admin có thể chặn IP thủ công")
    public ResponseEntity<ApiResponse<Void>> blockIpManually(
            @RequestParam String ip,
            @RequestParam(required = false, defaultValue = "Chặn thủ công bởi Admin") String reason) {
        log.info("Admin đang chặn IP thủ công: {} - Lý do: {}", ip, reason);
        
        if (ipBlacklistService.isIpBlocked(ip)) {
            return ResponseEntity.ok(ApiResponse.success(null, 
                    String.format("IP %s đã bị chặn trước đó", ip)));
        }
        
        ipBlacklistService.blockIpPermanently(ip, reason);
        
        return ResponseEntity.ok(ApiResponse.success(null, 
                String.format("Đã chặn IP %s thành công", ip)));
    }
}
