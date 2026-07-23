package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.AssignmentSubmission;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bài nộp của sinh viên (kèm điểm + nhận xét). Dùng cho cả GV (danh sách) và SV (bài của mình).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionDto {
    private UUID id;
    private UUID itemId;
    private UUID studentId;
    private String studentName;
    private String studentCode;
    private String fileName;
    private String contentType;
    private Long size;
    private LocalDateTime submittedAt;
    private Boolean late;
    private Double grade;
    private String feedback;
    private LocalDateTime gradedAt;

    public static SubmissionDto fromEntity(AssignmentSubmission s) {
        return SubmissionDto.builder()
                .id(s.getId())
                .itemId(s.getItemId())
                .studentId(s.getStudentId())
                .fileName(s.getFileName())
                .contentType(s.getContentType())
                .size(s.getSize())
                .submittedAt(s.getSubmittedAt())
                .late(s.getLate())
                .grade(s.getGrade())
                .feedback(s.getFeedback())
                .gradedAt(s.getGradedAt())
                .build();
    }
}
