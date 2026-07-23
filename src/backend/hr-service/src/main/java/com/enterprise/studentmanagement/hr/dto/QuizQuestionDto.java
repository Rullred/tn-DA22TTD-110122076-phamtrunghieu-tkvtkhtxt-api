package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Câu hỏi + các lựa chọn. Dùng cho cả GV (kèm đáp án đúng) và SV (ẩn đáp án).
 * {@code needsReview} = parser không xác định được đáp án đúng, GV cần chọn lại.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizQuestionDto {
    private UUID id;
    private String content;
    private Integer orderIndex;
    private Boolean enabled;
    private Boolean needsReview;
    private List<QuizChoiceDto> choices;
}
