package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.TeachingProposal;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeachingProposalDto {
    private UUID id;
    private UUID teacherId;
    private String teacherName;
    private String subject;
    private String className;
    private String classCode;
    private String description;
    private String room;
    private Integer maxStudents;
    private String schedule;
    private String academicYear;
    private Integer semester;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
    private String status;
    private String rejectionReason;
    private UUID classId;
    private LocalDateTime createdAt;

    public static TeachingProposalDto fromEntity(TeachingProposal p) {
        return TeachingProposalDto.builder()
                .id(p.getId())
                .teacherId(p.getTeacherId())
                .teacherName(p.getTeacherName())
                .subject(p.getSubject())
                .className(p.getClassName())
                .classCode(p.getClassCode())
                .description(p.getDescription())
                .room(p.getRoom())
                .maxStudents(p.getMaxStudents())
                .schedule(p.getSchedule())
                .academicYear(p.getAcademicYear())
                .semester(p.getSemester())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .notes(p.getNotes())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .rejectionReason(p.getRejectionReason())
                .classId(p.getClassId())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
