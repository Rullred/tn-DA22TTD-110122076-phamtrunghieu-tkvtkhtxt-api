package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.ForumReply;
import com.enterprise.studentmanagement.hr.entity.ForumThread;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.ForumReplyRepository;
import com.enterprise.studentmanagement.hr.repository.ForumThreadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Diễn đàn thảo luận theo lớp học phần: chủ đề + trả lời.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumThreadRepository threadRepository;
    private final ForumReplyRepository replyRepository;

    @Transactional(readOnly = true)
    public List<ForumThreadDto> listThreads(UUID classId) {
        return threadRepository.findByClassIdOrderByCreatedAtDesc(classId).stream()
                .map(t -> {
                    ForumThreadDto dto = ForumThreadDto.fromEntity(t);
                    dto.setReplyCount((int) replyRepository.countByThreadId(t.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ForumThreadDto createThread(UUID classId, CreateThreadRequest req) {
        ForumThread t = threadRepository.save(ForumThread.builder()
                .classId(classId)
                .title(req.getTitle())
                .content(req.getContent())
                .authorId(req.getAuthorId())
                .authorName(req.getAuthorName())
                .authorRole(req.getAuthorRole())
                .build());
        ForumThreadDto dto = ForumThreadDto.fromEntity(t);
        dto.setReplyCount(0);
        return dto;
    }

    @Transactional(readOnly = true)
    public ForumThreadDto getThread(UUID threadId) {
        ForumThread t = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread", "id", threadId));
        ForumThreadDto dto = ForumThreadDto.fromEntity(t);
        List<ForumReplyDto> replies = replyRepository.findByThreadIdOrderByCreatedAtAsc(threadId).stream()
                .map(ForumReplyDto::fromEntity).collect(Collectors.toList());
        dto.setReplies(replies);
        dto.setReplyCount(replies.size());
        return dto;
    }

    @Transactional
    public ForumReplyDto addReply(UUID threadId, CreateReplyRequest req) {
        if (!threadRepository.existsById(threadId)) {
            throw new ResourceNotFoundException("Thread", "id", threadId);
        }
        ForumReply r = replyRepository.save(ForumReply.builder()
                .threadId(threadId)
                .content(req.getContent())
                .authorId(req.getAuthorId())
                .authorName(req.getAuthorName())
                .authorRole(req.getAuthorRole())
                .build());
        return ForumReplyDto.fromEntity(r);
    }

    @Transactional
    public void deleteThread(UUID threadId) {
        if (!threadRepository.existsById(threadId)) {
            throw new ResourceNotFoundException("Thread", "id", threadId);
        }
        // Trả lời được dọn bởi FK CASCADE.
        threadRepository.deleteById(threadId);
    }

    @Transactional
    public void deleteReply(UUID replyId) {
        if (!replyRepository.existsById(replyId)) {
            throw new ResourceNotFoundException("Reply", "id", replyId);
        }
        replyRepository.deleteById(replyId);
    }
}
