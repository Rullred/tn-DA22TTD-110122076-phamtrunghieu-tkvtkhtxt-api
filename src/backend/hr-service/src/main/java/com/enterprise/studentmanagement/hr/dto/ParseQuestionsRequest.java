package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Yêu cầu tách khối text thành câu hỏi trắc nghiệm.
 * {@code replace=true} (mặc định) sẽ thay toàn bộ câu hỏi hiện có của bài.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParseQuestionsRequest {

    @NotBlank(message = "Text is required")
    private String text;

    @Builder.Default
    private boolean replace = true;
}
