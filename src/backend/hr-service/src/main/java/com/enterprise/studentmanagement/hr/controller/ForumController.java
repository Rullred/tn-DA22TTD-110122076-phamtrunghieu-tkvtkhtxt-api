package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.service.ForumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST API cho diễn đàn thảo luận theo lớp học phần.
 */
@Slf4j
@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/class/{classId}/threads")
    public ResponseEntity<ApiResponse<List<ForumThreadDto>>> threads(@PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.success(forumService.listThreads(classId), "Danh sách thảo luận"));
    }

    @PostMapping("/class/{classId}/threads")
    public ResponseEntity<ApiResponse<ForumThreadDto>> createThread(
            @PathVariable UUID classId, @Valid @RequestBody CreateThreadRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(forumService.createThread(classId, req), "Đã đăng chủ đề"));
    }

    @GetMapping("/threads/{threadId}")
    public ResponseEntity<ApiResponse<ForumThreadDto>> thread(@PathVariable UUID threadId) {
        return ResponseEntity.ok(ApiResponse.success(forumService.getThread(threadId), "Chi tiết thảo luận"));
    }

    @PostMapping("/threads/{threadId}/replies")
    public ResponseEntity<ApiResponse<ForumReplyDto>> reply(
            @PathVariable UUID threadId, @Valid @RequestBody CreateReplyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(forumService.addReply(threadId, req), "Đã trả lời"));
    }

    @DeleteMapping("/threads/{threadId}")
    public ResponseEntity<ApiResponse<Void>> deleteThread(@PathVariable UUID threadId) {
        forumService.deleteThread(threadId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa chủ đề"));
    }

    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> deleteReply(@PathVariable UUID replyId) {
        forumService.deleteReply(replyId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa trả lời"));
    }
}
