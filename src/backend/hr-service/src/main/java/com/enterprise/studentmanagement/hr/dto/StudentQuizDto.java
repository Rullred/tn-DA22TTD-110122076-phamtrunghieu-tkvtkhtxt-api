package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.UUID;

/**
 * Bài trắc nghiệm hiển thị cho sinh viên (đã xuất bản, thuộc lớp SV đăng ký),
 * kèm điểm cao nhất và số lần đã làm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentQuizDto {
    private UUID quizId;
    private UUID classId;
    private String className;
    private String title;
    private String description;
    private Integer questionsPerAttempt;
    private Integer enabledQuestions;
    private Integer timeLimitMinutes;
    private Double maxScore;
    private Double bestScore;
    private Integer attemptCount;
}
