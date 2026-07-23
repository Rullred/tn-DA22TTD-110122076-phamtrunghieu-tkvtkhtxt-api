package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST API cho trắc nghiệm online.
 * Tất cả endpoint (kể cả nộp bài) nằm dưới /api/quizzes để khớp một route gateway duy nhất.
 */
@Slf4j
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    // ------------------------------------------------------------------ Teacher

    @PostMapping
    public ResponseEntity<ApiResponse<QuizDto>> create(@Valid @RequestBody CreateQuizRequest request) {
        QuizDto dto = quizService.createQuiz(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Đã tạo bài trắc nghiệm"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizDto>> update(
            @PathVariable UUID id, @RequestBody UpdateQuizRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quizService.updateQuiz(id, request), "Đã cập nhật bài"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa bài trắc nghiệm"));
    }

    /** Danh sách bài trắc nghiệm của một lớp học phần (cho GV). */
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<QuizDto>>> listByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.listByClass(classId), "Danh sách bài trắc nghiệm"));
    }

    /** Chi tiết bài kèm câu hỏi + đáp án đúng (GV). */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizDto>> getForTeacher(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(quizService.getQuiz(id, true), "Chi tiết bài trắc nghiệm"));
    }

    /** Dán khối text -> tách câu hỏi (mặc định thay toàn bộ câu hỏi hiện có). */
    @PostMapping("/{id}/questions/parse")
    public ResponseEntity<ApiResponse<QuizDto>> parseQuestions(
            @PathVariable UUID id, @Valid @RequestBody ParseQuestionsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.parseAndReplaceQuestions(id, request), "Đã tách câu hỏi"));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<QuizQuestionDto>> addQuestion(
            @PathVariable UUID id, @Valid @RequestBody UpsertQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(quizService.addQuestion(id, request), "Đã thêm câu hỏi"));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<QuizQuestionDto>> updateQuestion(
            @PathVariable UUID questionId, @Valid @RequestBody UpsertQuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.updateQuestion(questionId, request), "Đã cập nhật câu hỏi"));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable UUID questionId) {
        quizService.deleteQuestion(questionId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa câu hỏi"));
    }

    /** Bảng điểm (mỗi SV, điểm cao nhất). */
    @GetMapping("/{id}/results")
    public ResponseEntity<ApiResponse<List<QuizResultRowDto>>> results(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(quizService.getResults(id), "Bảng điểm bài trắc nghiệm"));
    }

    /** Xuất điểm cao nhất vào Điểm thành phần 1 (điểm quá trình) của lớp. */
    @PostMapping("/{id}/export-grades")
    public ResponseEntity<ApiResponse<Integer>> exportGrades(@PathVariable UUID id) {
        int n = quizService.exportGrades(id);
        return ResponseEntity.ok(ApiResponse.success(n, "Đã xuất điểm quá trình cho " + n + " sinh viên"));
    }

    // ------------------------------------------------------------------ Student

    /** Bài đã xuất bản thuộc các lớp SV đăng ký (kèm điểm cao nhất). */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<StudentQuizDto>>> studentQuizzes(@PathVariable UUID studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.getStudentQuizzes(studentId), "Bài trắc nghiệm của sinh viên"));
    }

    /** Bắt đầu làm bài: bốc đề ngẫu nhiên, ẩn đáp án. */
    @PostMapping("/{id}/attempts/start")
    public ResponseEntity<ApiResponse<StartAttemptResponse>> startAttempt(
            @PathVariable UUID id, @RequestParam UUID studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.startAttempt(id, studentId), "Bắt đầu làm bài"));
    }

    /** Nộp bài -> chấm ngay. */
    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<ApiResponse<AttemptResultDto>> submitAttempt(
            @PathVariable UUID attemptId, @RequestBody SubmitAttemptRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.submitAttempt(attemptId, request), "Đã nộp bài"));
    }

    /** Các lượt đã nộp của SV cho một bài. */
    @GetMapping("/{id}/attempts")
    public ResponseEntity<ApiResponse<List<AttemptResultDto>>> studentAttempts(
            @PathVariable UUID id, @RequestParam UUID studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                quizService.getStudentAttempts(id, studentId), "Lịch sử làm bài"));
    }
}
