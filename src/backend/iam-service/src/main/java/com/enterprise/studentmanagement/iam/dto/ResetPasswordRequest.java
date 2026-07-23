package com.enterprise.studentmanagement.iam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Request DTO cho admin đặt lại mật khẩu người dùng về mặc định.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "usernameOrEmail is required")
    private String usernameOrEmail;
}
