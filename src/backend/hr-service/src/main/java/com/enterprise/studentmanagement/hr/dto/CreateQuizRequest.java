package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * Yêu cầu tạo bài trắc nghiệm mới cho một lớp học phần.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuizRequest {

    @NotNull(message = "classId is required")
    private UUID classId;

    private UUID teacherId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    /** Số câu bốc mỗi lượt; null = dùng tất cả câu đang bật. */
    private Integer questionsPerAttempt;

    private Integer timeLimitMinutes;

    private Double maxScore;
}
