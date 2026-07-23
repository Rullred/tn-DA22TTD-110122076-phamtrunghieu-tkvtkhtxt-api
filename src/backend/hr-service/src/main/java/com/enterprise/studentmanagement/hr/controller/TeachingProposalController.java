package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.service.TeachingProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST API cho đề xuất giảng dạy (GV gửi, Admin duyệt/từ chối).
 */
@Slf4j
@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class TeachingProposalController {

    private final TeachingProposalService proposalService;

    /** Admin: tất cả đề xuất, lọc theo trạng thái (?status=CHO_DUYET). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TeachingProposalDto>>> list(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(proposalService.list(status), "Danh sách đề xuất"));
    }

    /** GV: các đề xuất của chính mình (kèm trạng thái). */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<List<TeachingProposalDto>>> byTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(ApiResponse.success(proposalService.listByTeacher(teacherId), "Đề xuất của giảng viên"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeachingProposalDto>> create(@Valid @RequestBody CreateProposalRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(proposalService.create(req), "Đã gửi đề xuất đăng ký dạy"));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<TeachingProposalDto>> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(proposalService.approve(id), "Đã duyệt và tạo lớp học phần"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<TeachingProposalDto>> reject(
            @PathVariable UUID id, @RequestBody(required = false) RejectProposalRequest req) {
        return ResponseEntity.ok(ApiResponse.success(proposalService.reject(id, req), "Đã từ chối đề xuất"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        proposalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa đề xuất"));
    }
}
