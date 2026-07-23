package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.AssignmentSubmission;
import com.enterprise.studentmanagement.hr.entity.LearningFile;
import com.enterprise.studentmanagement.hr.service.FileUploadService;
import com.enterprise.studentmanagement.hr.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * REST API cho hệ Học tập (tài liệu + bài tập nộp file). Tất cả dưới /api/learning để
 * khớp một route gateway duy nhất. Không có Spring Security ở service (gateway lo xác thực).
 */
@Slf4j
@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;
    private final FileUploadService fileUploadService;

    // ------------------------------------------------------------------- Giáo viên

    @GetMapping("/class/{classId}/items")
    public ResponseEntity<ApiResponse<List<LearningItemDto>>> teacherItems(@PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.listForTeacher(classId), "Danh sách nội dung học tập"));
    }

    @PostMapping("/class/{classId}/items")
    public ResponseEntity<ApiResponse<LearningItemDto>> createItem(
            @PathVariable UUID classId, @Valid @RequestBody CreateItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(learningService.createItem(classId, req), "Đã tạo mục học tập"));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<LearningItemDto>> updateItem(
            @PathVariable UUID id, @RequestBody UpdateItemRequest req) {
        return ResponseEntity.ok(ApiResponse.success(learningService.updateItem(id, req), "Đã cập nhật mục"));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID id) {
        learningService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa mục học tập"));
    }

    @PostMapping("/items/{id}/files")
    public ResponseEntity<ApiResponse<LearningFileDto>> attachFile(
            @PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(learningService.attachFile(id, file), "Đã tải tệp lên"));
    }

    @PostMapping("/items/{id}/link")
    public ResponseEntity<ApiResponse<LearningFileDto>> attachLink(
            @PathVariable UUID id, @Valid @RequestBody AttachLinkRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(learningService.attachLink(id, req), "Đã thêm liên kết"));
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<ApiResponse<Void>> removeFile(@PathVariable UUID fileId) {
        learningService.removeFile(fileId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tệp"));
    }

    @GetMapping("/items/{id}/submissions")
    public ResponseEntity<ApiResponse<List<SubmissionDto>>> submissions(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.listSubmissions(id), "Danh sách bài nộp"));
    }

    @PutMapping("/submissions/{subId}/grade")
    public ResponseEntity<ApiResponse<SubmissionDto>> grade(
            @PathVariable UUID subId, @RequestBody GradeSubmissionRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.gradeSubmission(subId, req), "Đã chấm điểm bài nộp"));
    }

    // ------------------------------------------------------------------- Sinh viên

    @GetMapping("/student/{studentId}/class/{classId}/items")
    public ResponseEntity<ApiResponse<List<LearningItemDto>>> studentItems(
            @PathVariable UUID studentId, @PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.listForStudent(classId, studentId), "Nội dung học tập"));
    }

    @PostMapping("/items/{itemId}/submit")
    public ResponseEntity<ApiResponse<SubmissionDto>> submit(
            @PathVariable UUID itemId, @RequestParam UUID studentId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.submit(itemId, studentId, file), "Đã nộp bài"));
    }

    @GetMapping("/student/{studentId}/class/{classId}/progress")
    public ResponseEntity<ApiResponse<ProgressDto>> progress(
            @PathVariable UUID studentId, @PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.success(
                learningService.getProgress(classId, studentId), "Tiến độ khóa học"));
    }

    @PostMapping("/items/{itemId}/complete")
    public ResponseEntity<ApiResponse<Void>> markComplete(
            @PathVariable UUID itemId, @RequestParam UUID studentId) {
        learningService.markComplete(itemId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu hoàn thành"));
    }

    @DeleteMapping("/items/{itemId}/complete")
    public ResponseEntity<ApiResponse<Void>> unmarkComplete(
            @PathVariable UUID itemId, @RequestParam UUID studentId) {
        learningService.unmarkComplete(itemId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ đánh dấu"));
    }

    // ------------------------------------------------------------------- Tải file

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID fileId) {
        LearningFile f = learningService.getFile(fileId);
        if (f.getExternalLink() != null) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(f.getExternalLink())).build();
        }
        return streamFile(f.getStoragePath(), f.getFileName(), f.getContentType());
    }

    @GetMapping("/submissions/{subId}/download")
    public ResponseEntity<Resource> downloadSubmission(@PathVariable UUID subId) {
        AssignmentSubmission s = learningService.getSubmission(subId);
        return streamFile(s.getStoragePath(), s.getFileName(), s.getContentType());
    }

    private ResponseEntity<Resource> streamFile(String storagePath, String fileName, String contentType) {
        Resource resource = fileUploadService.loadAsResource(storagePath);
        MediaType mediaType;
        try {
            mediaType = contentType != null ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        ContentDisposition cd = ContentDisposition.attachment()
                .filename(fileName != null ? fileName : "download", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(mediaType)
                .body(resource);
    }
}
