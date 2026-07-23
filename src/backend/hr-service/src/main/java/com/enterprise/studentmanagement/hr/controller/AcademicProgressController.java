package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.AcademicProgressDto;
import com.enterprise.studentmanagement.hr.dto.ApiResponse;
import com.enterprise.studentmanagement.hr.dto.GpaDistributionDto;
import com.enterprise.studentmanagement.hr.service.AcademicProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for a student's academic progress (tiến độ học tập),
 * đối chiếu chương trình khung để xác định nợ môn / rớt môn.
 */
@Slf4j
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class AcademicProgressController {

    private final AcademicProgressService academicProgressService;

    /**
     * GET /api/students/{studentId}/academic-progress?namHoc=&hocKy=
     */
    @GetMapping("/{studentId}/academic-progress")
    public ResponseEntity<ApiResponse<AcademicProgressDto>> getProgress(
            @PathVariable UUID studentId,
            @RequestParam(required = false) String namHoc,
            @RequestParam(required = false) Integer hocKy) {

        log.info("GET /api/students/{}/academic-progress - namHoc: {}, hocKy: {}", studentId, namHoc, hocKy);

        AcademicProgressDto progress = academicProgressService.getProgress(studentId, namHoc, hocKy);
        return ResponseEntity.ok(ApiResponse.success(progress, "Academic progress retrieved successfully"));
    }

    /**
     * GET /api/students/gpa-distribution
     * Phân bố xếp loại học lực toàn trường (tính từ điểm thật). Dùng cho widget Dashboard.
     * Đường dẫn literal nên được ưu tiên hơn /{studentId} của StudentController.
     */
    @GetMapping("/gpa-distribution")
    public ResponseEntity<ApiResponse<GpaDistributionDto>> getGpaDistribution() {
        return ResponseEntity.ok(
                ApiResponse.success(academicProgressService.getGpaDistribution(), "GPA distribution retrieved successfully"));
    }
}
