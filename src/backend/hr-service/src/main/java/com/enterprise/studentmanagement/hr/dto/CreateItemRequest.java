package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tạo mục học tập mới (Tài liệu hoặc Bài tập).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateItemRequest {

    /** TAI_LIEU | BAI_TAP */
    @NotBlank(message = "type is required")
    private String type;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Boolean visible;

    // Bài tập
    private LocalDateTime dueDate;
    private Double maxScore;
}
