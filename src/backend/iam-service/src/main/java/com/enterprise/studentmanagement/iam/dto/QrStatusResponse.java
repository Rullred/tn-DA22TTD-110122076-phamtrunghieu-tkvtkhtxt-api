package com.enterprise.studentmanagement.iam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * QR Status Response DTO
 * Response for checking QR login status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrStatusResponse {
    
    /**
     * Status: PENDING, CONFIRMED, EXPIRED
     */
    private String status;
    
    /**
     * Access token (only when CONFIRMED)
     */
    private String accessToken;
    
    /**
     * Refresh token (only when CONFIRMED)
     */
    private String refreshToken;
    
    /**
     * User info (only when CONFIRMED)
     */
    private UserResponse user;
    
    /**
     * Token type (Bearer)
     */
    private String tokenType;
}
