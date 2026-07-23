package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Trả về khi SV bắt đầu làm bài: đề đã bốc ngẫu nhiên, lựa chọn đã xáo, KHÔNG kèm đáp án.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StartAttemptResponse {
    private UUID attemptId;
    private UUID quizId;
    private String title;
    private Integer timeLimitMinutes;
    private Double maxScore;
    private Integer questionCount;
    private List<QuizQuestionDto> questions;
}
