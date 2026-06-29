package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.ApiResponse;
import com.enterprise.studentmanagement.hr.dto.StudentDto;
import com.enterprise.studentmanagement.hr.dto.TeacherDto;
import com.enterprise.studentmanagement.hr.service.FileUploadService;
import com.enterprise.studentmanagement.hr.service.StudentService;
import com.enterprise.studentmanagement.hr.service.TeacherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * File Upload Controller
 * Handles file upload endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;
    private final StudentService studentService;
    private final TeacherService teacherService;

    /**
     * Upload student avatar
     * POST /api/upload/students/{id}/avatar
     */
    @PostMapping("/students/{id}/avatar")
    public ResponseEntity<ApiResponse<StudentDto>> uploadStudentAvatar(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        
        log.info("POST /api/upload/students/{}/avatar", id);

        // Upload file
        String avatarUrl = fileUploadService.uploadAvatar(file, "student", id);

        // Update student avatar
        StudentDto student = studentService.updateStudentAvatar(id, avatarUrl);

        return ResponseEntity.ok(ApiResponse.success(student, "Avatar uploaded successfully"));
    }

    /**
     * Upload teacher avatar
     * POST /api/upload/teachers/{id}/avatar
     */
    @PostMapping("/teachers/{id}/avatar")
    public ResponseEntity<ApiResponse<TeacherDto>> uploadTeacherAvatar(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        
        log.info("POST /api/upload/teachers/{}/avatar", id);

        // Upload file
        String avatarUrl = fileUploadService.uploadAvatar(file, "teacher", id);

        // Update teacher avatar
        TeacherDto teacher = teacherService.updateTeacherAvatar(id, avatarUrl);

        return ResponseEntity.ok(ApiResponse.success(teacher, "Avatar uploaded successfully"));
    }

    /**
     * Delete student avatar
     * DELETE /api/upload/students/{id}/avatar
     */
    @DeleteMapping("/students/{id}/avatar")
    public ResponseEntity<ApiResponse<StudentDto>> deleteStudentAvatar(@PathVariable UUID id) {
        log.info("DELETE /api/upload/students/{}/avatar", id);

        // Get current student
        StudentDto student = studentService.getStudentById(id);

        // Delete file
        if (student.getAvatarUrl() != null) {
            fileUploadService.deleteAvatar(student.getAvatarUrl());
        }

        // Update student avatar to null
        student = studentService.updateStudentAvatar(id, null);

        return ResponseEntity.ok(ApiResponse.success(student, "Avatar deleted successfully"));
    }

    /**
     * Delete teacher avatar
     * DELETE /api/upload/teachers/{id}/avatar
     */
    @DeleteMapping("/teachers/{id}/avatar")
    public ResponseEntity<ApiResponse<TeacherDto>> deleteTeacherAvatar(@PathVariable UUID id) {
        log.info("DELETE /api/upload/teachers/{}/avatar", id);

        // Get current teacher
        TeacherDto teacher = teacherService.getTeacherById(id);

        // Delete file
        if (teacher.getAvatarUrl() != null) {
            fileUploadService.deleteAvatar(teacher.getAvatarUrl());
        }

        // Update teacher avatar to null
        teacher = teacherService.updateTeacherAvatar(id, null);

        return ResponseEntity.ok(ApiResponse.success(teacher, "Avatar deleted successfully"));
    }
}
