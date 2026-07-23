package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

/**
 * Tạo chủ đề thảo luận. Tác giả (id/tên/vai trò) do FE đã xác thực truyền lên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateThreadRequest {

    @NotBlank(message = "Tiêu đề là bắt buộc")
    private String title;

    private String content;

    private UUID authorId;
    private String authorName;
    private String authorRole; // GIANG_VIEN | SINH_VIEN
}
