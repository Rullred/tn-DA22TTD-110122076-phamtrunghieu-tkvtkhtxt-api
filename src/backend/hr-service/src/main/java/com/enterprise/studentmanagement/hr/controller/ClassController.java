package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.SchoolClass;
import com.enterprise.studentmanagement.hr.service.ClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Class Controller
 * REST API endpoints for class and enrollment management
 */
@Slf4j
@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;

    /**
     * Get all classes with pagination
     * GET /api/classes
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ClassDto>>> getAllClasses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        log.info("GET /api/classes - page: {}, size: {}", page, size);
        
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ClassDto> response = classService.getAllClasses(pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Classes retrieved successfully"));
    }

    /**
     * Get class by ID
     * GET /api/classes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassDto>> getClassById(@PathVariable UUID id) {
        log.info("GET /api/classes/{}", id);
        
        ClassDto classDto = classService.getClassById(id);
        
        return ResponseEntity.ok(ApiResponse.success(classDto, "Class retrieved successfully"));
    }

    /**
     * Get class by code
     * GET /api/classes/code/{code}
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<ClassDto>> getClassByCode(@PathVariable String code) {
        log.info("GET /api/classes/code/{}", code);
        
        ClassDto classDto = classService.getClassByCode(code);
        
        return ResponseEntity.ok(ApiResponse.success(classDto, "Class retrieved successfully"));
    }

    /**
     * Search classes by name
     * GET /api/classes/search?name=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<ClassDto>>> searchClasses(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/classes/search?name={}", name);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ClassDto> response = classService.searchClassesByName(name, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Classes found"));
    }

    /**
     * Get classes by teacher
     * GET /api/classes/teacher/{teacherId}
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<PageResponse<ClassDto>>> getClassesByTeacher(
            @PathVariable UUID teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/classes/teacher/{}", teacherId);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ClassDto> response = classService.getClassesByTeacher(teacherId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Classes retrieved successfully"));
    }

    /**
     * Get classes by status
     * GET /api/classes/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<PageResponse<ClassDto>>> getClassesByStatus(
            @PathVariable SchoolClass.ClassStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/classes/status/{}", status);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ClassDto> response = classService.getClassesByStatus(status, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Classes retrieved successfully"));
    }

    /**
     * Create a new class
     * POST /api/classes
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ClassDto>> createClass(@Valid @RequestBody CreateClassRequest request) {
        log.info("POST /api/classes - Creating class: {}", request.getClassName());
        
        ClassDto classDto = classService.createClass(request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(classDto, "Class created successfully"));
    }

    /**
     * Update class
     * PUT /api/classes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassDto>> updateClass(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClassRequest request) {
        
        log.info("PUT /api/classes/{}", id);
        
        ClassDto classDto = classService.updateClass(id, request);
        
        return ResponseEntity.ok(ApiResponse.success(classDto, "Class updated successfully"));
    }

    /**
     * Delete class
     * DELETE /api/classes/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClass(@PathVariable UUID id) {
        log.info("DELETE /api/classes/{}", id);
        
        classService.deleteClass(id);
        
        return ResponseEntity.ok(ApiResponse.success("Class deleted successfully"));
    }

    /**
     * Enroll student in class
     * POST /api/classes/{classId}/enroll
     */
    @PostMapping("/{classId}/enroll")
    public ResponseEntity<ApiResponse<EnrollmentDto>> enrollStudent(
            @PathVariable UUID classId,
            @Valid @RequestBody EnrollStudentRequest request) {
        
        log.info("POST /api/classes/{}/enroll - Student: {}", classId, request.getStudentId());
        
        EnrollmentDto enrollment = classService.enrollStudent(classId, request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(enrollment, "Student enrolled successfully"));
    }

    /**
     * Drop student from class
     * DELETE /api/classes/{classId}/students/{studentId}
     */
    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> dropStudent(
            @PathVariable UUID classId,
            @PathVariable UUID studentId) {
        
        log.info("DELETE /api/classes/{}/students/{}", classId, studentId);
        
        classService.dropStudent(classId, studentId);
        
        return ResponseEntity.ok(ApiResponse.success("Student dropped successfully"));
    }

    /**
     * Get enrollments for a class
     * GET /api/classes/{classId}/enrollments
     */
    @GetMapping("/{classId}/enrollments")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentDto>>> getClassEnrollments(
            @PathVariable UUID classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/classes/{}/enrollments", classId);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<EnrollmentDto> response = classService.getClassEnrollments(classId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Enrollments retrieved successfully"));
    }

    /**
     * Get active students in a class
     * GET /api/classes/{classId}/students
     */
    @GetMapping("/{classId}/students")
    public ResponseEntity<ApiResponse<List<StudentDto>>> getActiveStudentsInClass(@PathVariable UUID classId) {
        log.info("GET /api/classes/{}/students", classId);
        
        List<StudentDto> students = classService.getActiveStudentsInClass(classId);
        
        return ResponseEntity.ok(ApiResponse.success(students, "Students retrieved successfully"));
    }

    /**
     * Update enrollment
     * PUT /api/classes/enrollments/{enrollmentId}
     */
    @PutMapping("/enrollments/{enrollmentId}")
    public ResponseEntity<ApiResponse<EnrollmentDto>> updateEnrollment(
            @PathVariable UUID enrollmentId,
            @Valid @RequestBody UpdateEnrollmentRequest request) {
        
        log.info("PUT /api/classes/enrollments/{}", enrollmentId);
        
        EnrollmentDto enrollment = classService.updateEnrollment(enrollmentId, request);
        
        return ResponseEntity.ok(ApiResponse.success(enrollment, "Enrollment updated successfully"));
    }

    /**
     * Get enrollments for a student
     * GET /api/classes/students/{studentId}/enrollments
     */
    @GetMapping("/students/{studentId}/enrollments")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentDto>>> getStudentEnrollments(
            @PathVariable UUID studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/classes/students/{}/enrollments", studentId);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<EnrollmentDto> response = classService.getStudentEnrollments(studentId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Enrollments retrieved successfully"));
    }

    /**
     * Get class count by status
     * GET /api/classes/count/status/{status}
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<ApiResponse<Long>> countClassesByStatus(@PathVariable SchoolClass.ClassStatus status) {
        log.info("GET /api/classes/count/status/{}", status);
        
        long count = classService.countClassesByStatus(status);
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }

    /**
     * Get total class count
     * GET /api/classes/count
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countAllClasses() {
        log.info("GET /api/classes/count");
        
        long count = classService.countAllClasses();
        
        return ResponseEntity.ok(ApiResponse.success(count, "Count retrieved successfully"));
    }

    /**
     * Get available classes for student registration
     * GET /api/classes/available
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<PageResponse<AvailableClassDto>>> getAvailableClasses(
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Integer semester,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/classes/available - studentId: {}, academicYear: {}, semester: {}", 
                 studentId, academicYear, semester);
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AvailableClassDto> response = classService.getAvailableClasses(
            studentId, academicYear, semester, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Available classes retrieved successfully"));
    }

    /**
     * Student self-register for a class
     * POST /api/classes/{classId}/register
     */
    @PostMapping("/{classId}/register")
    public ResponseEntity<ApiResponse<EnrollmentDto>> registerForClass(
            @PathVariable UUID classId,
            @RequestParam UUID studentId) {
        
        log.info("POST /api/classes/{}/register - studentId: {}", classId, studentId);
        
        EnrollStudentRequest request = EnrollStudentRequest.builder()
                .studentId(studentId)
                .build();
        
        EnrollmentDto enrollment = classService.enrollStudent(classId, request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(enrollment, "Registered for class successfully"));
    }

    /**
     * Student cancel enrollment
     * DELETE /api/classes/{classId}/register
     */
    @DeleteMapping("/{classId}/register")
    public ResponseEntity<ApiResponse<Void>> cancelEnrollment(
            @PathVariable UUID classId,
            @RequestParam UUID studentId) {
        
        log.info("DELETE /api/classes/{}/register - studentId: {}", classId, studentId);
        
        classService.dropStudent(classId, studentId);
        
        return ResponseEntity.ok(ApiResponse.success("Enrollment cancelled successfully"));
    }
}

