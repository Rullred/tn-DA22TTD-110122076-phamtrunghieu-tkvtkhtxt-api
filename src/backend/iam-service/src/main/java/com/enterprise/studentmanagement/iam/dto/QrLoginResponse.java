package com.enterprise.studentmanagement.iam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * QR Login Response DTO
 * Contains QR code for user to scan
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrLoginResponse {
    
    /**
     * Unique login token (UUID)
     */
    private String loginToken;
    
    /**
     * QR code image as base64 data URL
     * Format: data:image/png;base64,iVBORw0KGgoAAAANS...
     */
    private String qrCodeDataUrl;
    
    /**
     * Confirmation link (what QR code contains)
     */
    private String confirmationLink;
    
    /**
     * Time until QR code expires (in seconds)
     */
    private long expiresIn;
    
    /**
     * Instruction for user
     */
    private String instruction;
}
