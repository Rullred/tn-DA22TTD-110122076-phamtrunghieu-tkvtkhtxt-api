package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.Quiz;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Bài trắc nghiệm. Khi liệt kê thì {@code questions} = null; khi xem chi tiết (GV)
 * thì {@code questions} kèm đáp án đúng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizDto {
    private UUID id;
    private UUID classId;
    private UUID teacherId;
    private String title;
    private String description;
    private Integer questionsPerAttempt;
    private Integer timeLimitMinutes;
    private Double maxScore;
    private String status;
    private String className;
    private Integer totalQuestions;
    private Integer enabledQuestions;
    private List<QuizQuestionDto> questions;

    public static QuizDto fromEntity(Quiz q) {
        return QuizDto.builder()
                .id(q.getId())
                .classId(q.getClassId())
                .teacherId(q.getTeacherId())
                .title(q.getTitle())
                .description(q.getDescription())
                .questionsPerAttempt(q.getQuestionsPerAttempt())
                .timeLimitMinutes(q.getTimeLimitMinutes())
                .maxScore(q.getMaxScore())
                .status(q.getStatus() != null ? q.getStatus().name() : null)
                .build();
    }
}
