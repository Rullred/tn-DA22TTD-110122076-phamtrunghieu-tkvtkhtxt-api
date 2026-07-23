package com.enterprise.studentmanagement.iam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * QR Login Request DTO
 * Request body for QR code login
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrLoginRequest {

    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;
}
