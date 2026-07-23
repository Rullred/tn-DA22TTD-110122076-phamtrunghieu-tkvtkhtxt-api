package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.Student;
import com.enterprise.studentmanagement.hr.service.StudentService;
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
 * Student Controller
 * REST API endpoints for student management
 */
@Slf4j
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    /**
     * Get all students with pagination
     * GET /api/students
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StudentDto>>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        log.info("GET /api/students - page: {}, size: {}", page, size);
        
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<StudentDto> response = studentService.getAllStudents(pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Students retrieved successfully"));
    }

    /**
     * Get student by ID
     * GET /api/students/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentDto>> getStudentById(@PathVariable UUID id) {
        log.info("GET /api/students/{}", id);
        
        StudentDto student = studentService.getStudentById(id);
        
        return ResponseEntity.ok(ApiResponse.success(student, "Student retrieved successfully"));
    }

    /**
     * Get student by code
     * GET /api/students/code/{code}
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<StudentDto>> getStudentByCode(@PathVariable String code) {
        log.info("GET /api/students/code/{}", code);
        
        StudentDto student = studentService.getStudentByCode(code);
        
        return ResponseEntity.ok(ApiResponse.success(student, "Student retrieved successfully"));
    }

    /**
     * Search students by name
     * GET /api/students/search?name=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<StudentDto>>> searchStudents(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/students/search?name={}", name);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<StudentDto> response = studentService.searchStudentsByName(name, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Students found"));
    }

    /**
     * Get students by status
     * GET /api/students/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<PageResponse<StudentDto>>> getStudentsByStatus(
            @PathVariable Student.StudentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/students/status/{}", status);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<StudentDto> response = studentService.getStudentsByStatus(status, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Students retrieved successfully"));
    }

    /**
     * Create a new student
     * POST /api/students
     */
    @PostMapping
    public ResponseEntity<ApiResponse<StudentDto>> createStudent(@Valid @RequestBody CreateStudentRequest request) {
        log.info("POST /api/students - Creating student: {} {}", request.getFirstName(), request.getLastName());
        
        StudentDto student = studentService.createStudent(request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(student, "Student created successfully"));
    }

    /**
     * Update student
     * PUT /api/students/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentDto>> updateStudent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStudentRequest request) {
        
        log.info("PUT /api/students/{}", id);
        
        StudentDto student = studentService.updateStudent(id, request);
        
        return ResponseEntity.ok(ApiResponse.success(student, "Student updated successfully"));
    }

    /**
     * Delete student
     * DELETE /api/students/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable UUID id) {
        log.info("DELETE /api/students/{}", id);
        
        studentService.deleteStudent(id);
        
        return ResponseEntity.ok(ApiResponse.success("Student deleted successfully"));
    }

    /**
     * Get student count by status
     * GET /api/students/count/status/{status}
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<ApiResponse<Long>> countStudentsByStatus(@PathVariable Student.StudentStatus status) {
        log.info("GET /api/students/count/status/{}", status);
        
        long count = studentService.countStudentsByStatus(status);
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }

    /**
     * Get total student count
     * GET /api/students/count
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countAllStudents() {
        log.info("GET /api/students/count");
        
        long count = studentService.countAllStudents();
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }

    /**
     * Update student conduct score (advisor only)
     * PUT /api/students/{id}/conduct-score
     */
    @PutMapping("/{id}/conduct-score")
    public ResponseEntity<ApiResponse<StudentDto>> updateConductScore(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConductScoreRequest request) {
        
        log.info("PUT /api/students/{}/conduct-score", id);
        
        StudentDto student = studentService.updateConductScore(id, request.getConductScore());
        
        return ResponseEntity.ok(ApiResponse.success(student, "Conduct score updated successfully"));
    }

    /**
     * Phân nhiều sinh viên vào một lớp cố vấn cùng lúc (gán GV cố vấn + mã lớp).
     * PUT /api/students/bulk-assign
     * Body: { "studentIds": [...], "advisorId": "<uuid>", "lopHanhChinh": "DA22TTD" }
     */
    @PutMapping("/bulk-assign")
    public ResponseEntity<ApiResponse<Integer>> bulkAssign(@Valid @RequestBody BulkAssignRequest request) {
        log.info("PUT /api/students/bulk-assign - {} students", request.getStudentIds() != null ? request.getStudentIds().size() : 0);

        int count = studentService.bulkAssign(request);

        return ResponseEntity.ok(ApiResponse.success(count, "Đã phân " + count + " sinh viên vào lớp cố vấn"));
    }

    /**
     * Assign / unassign a student's academic advisor.
     * PUT /api/students/{id}/advisor
     * Body: { "advisorId": "<uuid>" } to assign, or { "advisorId": null } to unassign.
     */
    @PutMapping("/{id}/advisor")
    public ResponseEntity<ApiResponse<StudentDto>> updateAdvisor(
            @PathVariable UUID id,
            @RequestBody UpdateAdvisorRequest request) {

        log.info("PUT /api/students/{}/advisor - advisorId: {}", id, request.getAdvisorId());

        StudentDto student = studentService.updateAdvisor(id, request.getAdvisorId());

        return ResponseEntity.ok(ApiResponse.success(student, "Advisor updated successfully"));
    }

    /**
     * Get students by advisor (for advisor to view their students)
     * GET /api/students/advisor/{advisorId}
     */
    @GetMapping("/advisor/{advisorId}")
    public ResponseEntity<ApiResponse<PageResponse<StudentDto>>> getStudentsByAdvisor(
            @PathVariable UUID advisorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/students/advisor/{}", advisorId);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<StudentDto> response = studentService.getStudentsByAdvisor(advisorId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Students retrieved successfully"));
    }
}
