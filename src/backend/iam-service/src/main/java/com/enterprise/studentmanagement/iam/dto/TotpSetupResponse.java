package com.enterprise.studentmanagement.iam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for TOTP setup containing QR code
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TotpSetupResponse {
    
    /**
     * The TOTP secret key (for manual entry)
     */
    private String secret;
    
    /**
     * QR code image as base64 data URL
     * Format: data:image/png;base64,iVBORw0KGgoAAAANS...
     */
    private String qrCodeDataUrl;
    
    /**
     * Formatted secret key for manual entry (XXXX-XXXX-XXXX format)
     */
    private String manualEntryKey;
}
