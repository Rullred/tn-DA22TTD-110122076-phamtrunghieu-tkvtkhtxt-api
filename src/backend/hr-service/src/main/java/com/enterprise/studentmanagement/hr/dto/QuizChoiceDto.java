package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.UUID;

/**
 * Lựa chọn của câu hỏi. {@code correct} bị bỏ (null) khi trả cho sinh viên làm bài.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizChoiceDto {
    private UUID id;
    private String content;
    private Boolean correct;
    private Integer orderIndex;
}
