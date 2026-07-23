package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

/**
 * Thêm mới hoặc sửa một câu hỏi kèm các lựa chọn (GV toàn quyền chỉnh).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpsertQuestionRequest {

    @NotBlank(message = "Question content is required")
    private String content;

    @Builder.Default
    private Boolean enabled = true;

    private List<ChoiceInput> choices;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChoiceInput {
        private String content;
        @Builder.Default
        private Boolean correct = false;
    }
}
