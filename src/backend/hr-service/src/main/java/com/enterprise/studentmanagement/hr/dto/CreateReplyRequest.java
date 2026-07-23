package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

/**
 * Trả lời một chủ đề thảo luận.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReplyRequest {

    @NotBlank(message = "Nội dung là bắt buộc")
    private String content;

    private UUID authorId;
    private String authorName;
    private String authorRole;
}
