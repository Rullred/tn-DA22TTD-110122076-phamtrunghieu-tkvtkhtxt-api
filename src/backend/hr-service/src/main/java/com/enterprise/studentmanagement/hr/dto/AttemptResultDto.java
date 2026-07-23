package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.UUID;

/**
 * Kết quả sau khi SV nộp bài: điểm lượt này + điểm cao nhất từ trước tới nay.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttemptResultDto {
    private UUID attemptId;
    private Double score;
    private Integer correctCount;
    private Integer questionCount;
    private Double maxScore;
    private Double bestScore;
}
