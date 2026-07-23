package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.Teacher;
import com.enterprise.studentmanagement.hr.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Teacher Controller
 * REST API endpoints for teacher management
 */
@Slf4j
@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    /**
     * Get all teachers with pagination
     * GET /api/teachers
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TeacherDto>>> getAllTeachers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        log.info("GET /api/teachers - page: {}, size: {}", page, size);
        
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<TeacherDto> response = teacherService.getAllTeachers(pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Teachers retrieved successfully"));
    }

    /**
     * Lấy hồ sơ giáo viên của người dùng hiện tại.
     * GET /api/teachers/me
     * Gateway inject X-User-Id; frontend có thể truyền thêm ?email= để fallback.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<TeacherDto>> getCurrentTeacher(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestParam(required = false) String email) {
        log.info("GET /api/teachers/me - userId: {}, email: {}", userId, email);

        TeacherDto teacher = teacherService.getCurrentTeacher(userId, email);

        return ResponseEntity.ok(ApiResponse.success(teacher, "Current teacher retrieved successfully"));
    }

    /**
     * Get teacher by ID
     * GET /api/teachers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherDto>> getTeacherById(@PathVariable UUID id) {
        log.info("GET /api/teachers/{}", id);
        
        TeacherDto teacher = teacherService.getTeacherById(id);
        
        return ResponseEntity.ok(ApiResponse.success(teacher, "Teacher retrieved successfully"));
    }

    /**
     * Get teacher by code
     * GET /api/teachers/code/{code}
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<TeacherDto>> getTeacherByCode(@PathVariable String code) {
        log.info("GET /api/teachers/code/{}", code);
        
        TeacherDto teacher = teacherService.getTeacherByCode(code);
        
        return ResponseEntity.ok(ApiResponse.success(teacher, "Teacher retrieved successfully"));
    }

    /**
     * Search teachers by name
     * GET /api/teachers/search?name=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<TeacherDto>>> searchTeachers(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/teachers/search?name={}", name);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<TeacherDto> response = teacherService.searchTeachersByName(name, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Teachers found"));
    }

    /**
     * Get teachers by department
     * GET /api/teachers/department/{department}
     */
    @GetMapping("/department/{department}")
    public ResponseEntity<ApiResponse<PageResponse<TeacherDto>>> getTeachersByDepartment(
            @PathVariable String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/teachers/department/{}", department);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<TeacherDto> response = teacherService.getTeachersByDepartment(department, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Teachers retrieved successfully"));
    }

    /**
     * Get teachers by status
     * GET /api/teachers/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<PageResponse<TeacherDto>>> getTeachersByStatus(
            @PathVariable Teacher.TeacherStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/teachers/status/{}", status);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<TeacherDto> response = teacherService.getTeachersByStatus(status, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Teachers retrieved successfully"));
    }

    /**
     * Create a new teacher
     * POST /api/teachers
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TeacherDto>> createTeacher(@Valid @RequestBody CreateTeacherRequest request) {
        log.info("POST /api/teachers - Creating teacher: {} {}", request.getFirstName(), request.getLastName());
        
        TeacherDto teacher = teacherService.createTeacher(request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(teacher, "Teacher created successfully"));
    }

    /**
     * Update teacher
     * PUT /api/teachers/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherDto>> updateTeacher(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTeacherRequest request) {
        
        log.info("PUT /api/teachers/{}", id);
        
        TeacherDto teacher = teacherService.updateTeacher(id, request);
        
        return ResponseEntity.ok(ApiResponse.success(teacher, "Teacher updated successfully"));
    }

    /**
     * Delete teacher
     * DELETE /api/teachers/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable UUID id) {
        log.info("DELETE /api/teachers/{}", id);
        
        teacherService.deleteTeacher(id);
        
        return ResponseEntity.ok(ApiResponse.success("Teacher deleted successfully"));
    }

    /**
     * Get teacher count by status
     * GET /api/teachers/count/status/{status}
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<ApiResponse<Long>> countTeachersByStatus(@PathVariable Teacher.TeacherStatus status) {
        log.info("GET /api/teachers/count/status/{}", status);
        
        long count = teacherService.countTeachersByStatus(status);
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }

    /**
     * Get teacher count by department
     * GET /api/teachers/count/department/{department}
     */
    @GetMapping("/count/department/{department}")
    public ResponseEntity<ApiResponse<Long>> countTeachersByDepartment(@PathVariable String department) {
        log.info("GET /api/teachers/count/department/{}", department);
        
        long count = teacherService.countTeachersByDepartment(department);
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }

    /**
     * Get total teacher count
     * GET /api/teachers/count
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countAllTeachers() {
        log.info("GET /api/teachers/count");
        
        long count = teacherService.countAllTeachers();
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }
}
