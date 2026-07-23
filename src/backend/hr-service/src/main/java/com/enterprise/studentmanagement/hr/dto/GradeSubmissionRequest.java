package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

import java.util.UUID;

/**
 * Chấm điểm + nhận xét cho một bài nộp (điểm nằm trong hệ học tập, không đổ vào bảng điểm).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionRequest {
    private Double grade;
    private String feedback;
    private UUID teacherId;
}
