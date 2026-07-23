package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.TeachingProposal;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.TeachingProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Đề xuất giảng dạy: GV gửi, Admin duyệt (tạo lớp thật qua {@link ClassService}) hoặc từ chối.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeachingProposalService {

    private final TeachingProposalRepository proposalRepository;
    private final ClassService classService;
    private final NotificationService notificationService;

    @Transactional
    public TeachingProposalDto create(CreateProposalRequest req) {
        TeachingProposal p = TeachingProposal.builder()
                .teacherId(req.getTeacherId())
                .teacherName(req.getTeacherName())
                .subject(req.getSubject())
                .className(req.getClassName())
                .classCode(req.getClassCode())
                .description(req.getDescription())
                .room(req.getRoom())
                .maxStudents(req.getMaxStudents())
                .schedule(req.getSchedule())
                .academicYear(req.getAcademicYear())
                .semester(req.getSemester())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .notes(req.getNotes())
                .status(TeachingProposal.ProposalStatus.CHO_DUYET)
                .build();
        p = proposalRepository.save(p);
        log.info("Created teaching proposal {} by teacher {}", p.getId(), p.getTeacherId());
        notificationService.create("SUBJECT_APPROVAL", "MEDIUM",
                p.getTeacherName() != null ? p.getTeacherName() : "Giảng viên",
                "Có yêu cầu duyệt mở môn học mới: " + p.getSubject()
                        + (p.getClassName() != null ? " (" + p.getClassName() + ")" : ""),
                "/admin/classes");
        return TeachingProposalDto.fromEntity(p);
    }

    @Transactional(readOnly = true)
    public List<TeachingProposalDto> list(String status) {
        List<TeachingProposal> list;
        if (status != null && !status.isBlank()) {
            TeachingProposal.ProposalStatus st;
            try {
                st = TeachingProposal.ProposalStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Trạng thái không hợp lệ: " + status);
            }
            list = proposalRepository.findByStatusOrderByCreatedAtDesc(st);
        } else {
            list = proposalRepository.findByOrderByCreatedAtDesc();
        }
        return list.stream().map(TeachingProposalDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeachingProposalDto> listByTeacher(UUID teacherId) {
        return proposalRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId).stream()
                .map(TeachingProposalDto::fromEntity).collect(Collectors.toList());
    }

    /** Admin duyệt: tạo lớp học phần thật từ đề xuất rồi đánh dấu DA_DUYET. */
    @Transactional
    public TeachingProposalDto approve(UUID id) {
        TeachingProposal p = getOrThrow(id);
        if (p.getStatus() != TeachingProposal.ProposalStatus.CHO_DUYET) {
            throw new BadRequestException("Đề xuất này đã được xử lý.");
        }

        String className = p.getClassName();
        if (className == null || className.isBlank()) {
            className = "Lớp " + p.getSubject()
                    + (p.getTeacherName() != null ? " (" + p.getTeacherName() + ")" : "");
        }
        className = cap(className, 100);
        String subject = cap(p.getSubject(), 100);
        String description = cap(p.getDescription() != null ? p.getDescription()
                : "Lớp mở từ đề xuất của GV " + (p.getTeacherName() != null ? p.getTeacherName() : ""), 500);

        LocalDate start = p.getStartDate() != null ? p.getStartDate() : LocalDate.now();
        LocalDate end = p.getEndDate() != null ? p.getEndDate() : start.plusDays(120);
        if (end.isBefore(start)) end = start.plusDays(120);

        int max = (p.getMaxStudents() != null && p.getMaxStudents() >= 1 && p.getMaxStudents() <= 100)
                ? p.getMaxStudents() : 40;
        int sem = (p.getSemester() != null && p.getSemester() >= 1 && p.getSemester() <= 3)
                ? p.getSemester() : 1;
        String year = (p.getAcademicYear() != null && !p.getAcademicYear().isBlank())
                ? p.getAcademicYear() : "2025-2026";

        CreateClassRequest cr = CreateClassRequest.builder()
                .className(className)
                .description(description)
                .teacherId(p.getTeacherId())
                .subject(subject)
                .room(p.getRoom() != null ? cap(p.getRoom(), 50) : "Phòng lý thuyết")
                .maxStudents(max)
                .schedule(p.getSchedule() != null ? cap(p.getSchedule(), 200) : null)
                .startDate(start)
                .endDate(end)
                .academicYear(year)
                .semester(sem)
                .build();

        ClassDto created = classService.createClass(cr);

        p.setStatus(TeachingProposal.ProposalStatus.DA_DUYET);
        p.setClassId(created.getId());
        p.setUpdatedAt(LocalDateTime.now());
        proposalRepository.save(p);
        log.info("Approved proposal {} -> class {}", id, created.getId());
        return TeachingProposalDto.fromEntity(p);
    }

    @Transactional
    public TeachingProposalDto reject(UUID id, RejectProposalRequest req) {
        TeachingProposal p = getOrThrow(id);
        if (p.getStatus() != TeachingProposal.ProposalStatus.CHO_DUYET) {
            throw new BadRequestException("Đề xuất này đã được xử lý.");
        }
        p.setStatus(TeachingProposal.ProposalStatus.TU_CHOI);
        p.setRejectionReason(req != null ? req.getReason() : null);
        p.setUpdatedAt(LocalDateTime.now());
        proposalRepository.save(p);
        return TeachingProposalDto.fromEntity(p);
    }

    @Transactional
    public void delete(UUID id) {
        if (!proposalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Proposal", "id", id);
        }
        proposalRepository.deleteById(id);
    }

    private TeachingProposal getOrThrow(UUID id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", "id", id));
    }

    private static String cap(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
