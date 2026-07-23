package com.enterprise.studentmanagement.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for verifying TOTP code
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TotpVerifyRequest {
    
    @NotBlank(message = "Mã phiên làm việc không được để trống")
    private String tempToken;
    
    @NotBlank(message = "Mã xác thực không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã xác thực phải là 6 chữ số")
    private String totpCode;
}
