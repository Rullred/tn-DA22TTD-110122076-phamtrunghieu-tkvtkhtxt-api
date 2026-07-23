package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Đính kèm một liên kết ngoài (thay cho tải file) vào mục học tập.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachLinkRequest {

    @NotBlank(message = "url is required")
    private String url;

    private String title;
}
