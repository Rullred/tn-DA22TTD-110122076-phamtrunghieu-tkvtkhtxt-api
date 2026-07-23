package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.*;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Business logic cho hệ Học tập: mục học tập (tài liệu/bài tập), tệp đính kèm và bài nộp.
 * Điểm chấm bài tập nằm ngay trong bài nộp — KHÔNG đổ vào bảng điểm thành phần.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearningService {

    private final LearningItemRepository itemRepository;
    private final LearningFileRepository fileRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final FileUploadService fileUploadService;
    private final ItemCompletionRepository completionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    private static final String DIR_MATERIALS = "materials";
    private static final String DIR_SUBMISSIONS = "submissions";

    // -------------------------------------------------------------------- Mục học tập

    @Transactional
    public LearningItemDto createItem(UUID classId, CreateItemRequest req) {
        LearningItem.ItemType type;
        try {
            type = LearningItem.ItemType.valueOf(req.getType());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Loại mục không hợp lệ: " + req.getType());
        }
        int order = itemRepository.findByClassIdOrderByOrderIndexAscCreatedAtAsc(classId).size();
        LearningItem item = LearningItem.builder()
                .classId(classId)
                .type(type)
                .title(req.getTitle())
                .description(req.getDescription())
                .visible(req.getVisible() == null || req.getVisible())
                .orderIndex(order)
                .dueDate(req.getDueDate())
                .maxScore(type == LearningItem.ItemType.BAI_TAP
                        ? (req.getMaxScore() != null ? req.getMaxScore() : 10.0) : null)
                .build();
        item = itemRepository.save(item);
        return toItemDto(item, false, null);
    }

    @Transactional
    public LearningItemDto updateItem(UUID itemId, UpdateItemRequest req) {
        LearningItem item = getItemOrThrow(itemId);
        if (req.getTitle() != null) item.setTitle(req.getTitle());
        if (req.getDescription() != null) item.setDescription(req.getDescription());
        if (req.getVisible() != null) item.setVisible(req.getVisible());
        if (req.getOrderIndex() != null) item.setOrderIndex(req.getOrderIndex());
        if (req.getDueDate() != null) item.setDueDate(req.getDueDate());
        if (req.getMaxScore() != null) item.setMaxScore(req.getMaxScore());
        item = itemRepository.save(item);
        return toItemDto(item, true, null);
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        LearningItem item = getItemOrThrow(itemId);
        // Xóa file trên đĩa trước, rồi để FK CASCADE dọn các dòng con.
        for (LearningFile f : fileRepository.findByItemIdOrderByCreatedAtAsc(itemId)) {
            fileUploadService.deleteDocument(f.getStoragePath());
        }
        for (AssignmentSubmission s : submissionRepository.findByItemIdOrderBySubmittedAtDesc(itemId)) {
            fileUploadService.deleteDocument(s.getStoragePath());
        }
        itemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<LearningItemDto> listForTeacher(UUID classId) {
        return itemRepository.findByClassIdOrderByOrderIndexAscCreatedAtAsc(classId).stream()
                .map(it -> toItemDto(it, true, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LearningItemDto> listForStudent(UUID classId, UUID studentId) {
        return itemRepository.findByClassIdOrderByOrderIndexAscCreatedAtAsc(classId).stream()
                .filter(it -> Boolean.TRUE.equals(it.getVisible()))
                .map(it -> toItemDto(it, false, studentId))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------- Tệp đính kèm

    @Transactional
    public LearningFileDto attachFile(UUID itemId, MultipartFile file) {
        getItemOrThrow(itemId);
        FileUploadService.StoredFile stored = fileUploadService.uploadDocument(file, DIR_MATERIALS);
        LearningFile f = fileRepository.save(LearningFile.builder()
                .itemId(itemId)
                .fileName(stored.getFileName())
                .storagePath(stored.getStoragePath())
                .contentType(stored.getContentType())
                .size(stored.getSize())
                .build());
        return LearningFileDto.fromEntity(f);
    }

    @Transactional
    public LearningFileDto attachLink(UUID itemId, AttachLinkRequest req) {
        getItemOrThrow(itemId);
        String title = (req.getTitle() != null && !req.getTitle().isBlank()) ? req.getTitle() : req.getUrl();
        LearningFile f = fileRepository.save(LearningFile.builder()
                .itemId(itemId)
                .fileName(title)
                .externalLink(req.getUrl())
                .build());
        return LearningFileDto.fromEntity(f);
    }

    @Transactional
    public void removeFile(UUID fileId) {
        LearningFile f = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", fileId));
        if (f.getStoragePath() != null) fileUploadService.deleteDocument(f.getStoragePath());
        fileRepository.delete(f);
    }

    @Transactional(readOnly = true)
    public LearningFile getFile(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", fileId));
    }

    // -------------------------------------------------------------------- Bài nộp

    @Transactional
    public SubmissionDto submit(UUID itemId, UUID studentId, MultipartFile file) {
        LearningItem item = getItemOrThrow(itemId);
        if (item.getType() != LearningItem.ItemType.BAI_TAP) {
            throw new BadRequestException("Mục này không phải bài tập nộp file.");
        }
        boolean enrolled = enrollmentRepository.existsByClassIdAndStudentIdAndStatus(
                item.getClassId(), studentId, ClassEnrollment.EnrollmentStatus.DA_DANG_KY);
        if (!enrolled) {
            throw new BadRequestException("Bạn chưa đăng ký lớp này nên không thể nộp bài.");
        }

        FileUploadService.StoredFile stored = fileUploadService.uploadDocument(file, DIR_SUBMISSIONS);
        boolean late = item.getDueDate() != null && LocalDateTime.now().isAfter(item.getDueDate());

        AssignmentSubmission sub = submissionRepository.findByItemIdAndStudentId(itemId, studentId)
                .orElse(null);
        if (sub != null) {
            // Nộp lại: xóa file cũ, cập nhật, reset điểm/nhận xét.
            fileUploadService.deleteDocument(sub.getStoragePath());
            sub.setFileName(stored.getFileName());
            sub.setStoragePath(stored.getStoragePath());
            sub.setContentType(stored.getContentType());
            sub.setSize(stored.getSize());
            sub.setSubmittedAt(LocalDateTime.now());
            sub.setLate(late);
            sub.setGrade(null);
            sub.setFeedback(null);
            sub.setGradedBy(null);
            sub.setGradedAt(null);
        } else {
            sub = AssignmentSubmission.builder()
                    .itemId(itemId)
                    .studentId(studentId)
                    .fileName(stored.getFileName())
                    .storagePath(stored.getStoragePath())
                    .contentType(stored.getContentType())
                    .size(stored.getSize())
                    .submittedAt(LocalDateTime.now())
                    .late(late)
                    .build();
        }
        sub = submissionRepository.save(sub);
        return SubmissionDto.fromEntity(sub);
    }

    @Transactional(readOnly = true)
    public List<SubmissionDto> listSubmissions(UUID itemId) {
        return submissionRepository.findByItemIdOrderBySubmittedAtDesc(itemId).stream()
                .map(this::toSubmissionDtoWithStudent)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubmissionDto gradeSubmission(UUID submissionId, GradeSubmissionRequest req) {
        AssignmentSubmission sub = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));
        sub.setGrade(req.getGrade());
        sub.setFeedback(req.getFeedback());
        sub.setGradedBy(req.getTeacherId());
        sub.setGradedAt(LocalDateTime.now());
        sub = submissionRepository.save(sub);
        return toSubmissionDtoWithStudent(sub);
    }

    @Transactional(readOnly = true)
    public AssignmentSubmission getSubmission(UUID submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));
    }

    // ----------------------------------------------------------------------- helpers

    private LearningItem getItemOrThrow(UUID itemId) {
        return itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningItem", "id", itemId));
    }

    private LearningItemDto toItemDto(LearningItem item, boolean includeSubmissionCount, UUID studentId) {
        LearningItemDto dto = LearningItemDto.fromEntity(item);
        dto.setFiles(fileRepository.findByItemIdOrderByCreatedAtAsc(item.getId()).stream()
                .map(LearningFileDto::fromEntity).collect(Collectors.toList()));
        if (item.getType() == LearningItem.ItemType.BAI_TAP) {
            if (includeSubmissionCount) {
                dto.setSubmissionCount((int) submissionRepository.countByItemId(item.getId()));
            }
            if (studentId != null) {
                submissionRepository.findByItemIdAndStudentId(item.getId(), studentId)
                        .ifPresent(s -> dto.setMySubmission(SubmissionDto.fromEntity(s)));
            }
        }
        if (studentId != null) {
            boolean done = item.getType() == LearningItem.ItemType.BAI_TAP
                    ? dto.getMySubmission() != null
                    : completionRepository.existsByItemIdAndStudentId(item.getId(), studentId);
            dto.setCompleted(done);
        }
        return dto;
    }

    // ----------------------------------------------------------------- Tiến độ %

    /** Đánh dấu / bỏ đánh dấu một mục tài liệu là đã xem (cho tiến độ). */
    @Transactional
    public void markComplete(UUID itemId, UUID studentId) {
        if (!completionRepository.existsByItemIdAndStudentId(itemId, studentId)) {
            completionRepository.save(ItemCompletion.builder().itemId(itemId).studentId(studentId).build());
        }
    }

    @Transactional
    public void unmarkComplete(UUID itemId, UUID studentId) {
        completionRepository.deleteByItemIdAndStudentId(itemId, studentId);
    }

    /** Tiến độ hoàn thành khóa học của SV: tài liệu đã xem + bài tập đã nộp + trắc nghiệm đã làm. */
    @Transactional(readOnly = true)
    public ProgressDto getProgress(UUID classId, UUID studentId) {
        List<LearningItem> items = itemRepository.findByClassIdOrderByOrderIndexAscCreatedAtAsc(classId).stream()
                .filter(i -> Boolean.TRUE.equals(i.getVisible()))
                .collect(Collectors.toList());
        List<LearningItem> materials = items.stream()
                .filter(i -> i.getType() == LearningItem.ItemType.TAI_LIEU).collect(Collectors.toList());
        List<LearningItem> assignments = items.stream()
                .filter(i -> i.getType() == LearningItem.ItemType.BAI_TAP).collect(Collectors.toList());
        List<Quiz> quizzes = quizRepository.findByClassIdInAndStatus(
                List.of(classId), Quiz.QuizStatus.DA_XUAT_BAN);

        List<UUID> matIds = materials.stream().map(LearningItem::getId).collect(Collectors.toList());
        int matDone = matIds.isEmpty() ? 0
                : completionRepository.findByStudentIdAndItemIdIn(studentId, matIds).size();

        int asgDone = 0;
        for (LearningItem a : assignments) {
            if (submissionRepository.findByItemIdAndStudentId(a.getId(), studentId).isPresent()) asgDone++;
        }

        int qzDone = 0;
        for (Quiz q : quizzes) {
            boolean attempted = quizAttemptRepository.findByQuizIdAndStudentId(q.getId(), studentId).stream()
                    .anyMatch(at -> at.getStatus() == QuizAttempt.AttemptStatus.DA_NOP);
            if (attempted) qzDone++;
        }

        int total = materials.size() + assignments.size() + quizzes.size();
        int completed = matDone + asgDone + qzDone;
        int percent = total > 0 ? (int) Math.round(completed * 100.0 / total) : 0;

        return ProgressDto.builder()
                .total(total).completed(completed).percent(percent)
                .materialsDone(matDone).materialsTotal(materials.size())
                .assignmentsDone(asgDone).assignmentsTotal(assignments.size())
                .quizzesDone(qzDone).quizzesTotal(quizzes.size())
                .build();
    }

    private SubmissionDto toSubmissionDtoWithStudent(AssignmentSubmission s) {
        SubmissionDto dto = SubmissionDto.fromEntity(s);
        studentRepository.findById(s.getStudentId()).ifPresent(st -> {
            dto.setStudentName(st.getLastName() + " " + st.getFirstName());
            dto.setStudentCode(st.getStudentCode());
        });
        return dto;
    }
}
