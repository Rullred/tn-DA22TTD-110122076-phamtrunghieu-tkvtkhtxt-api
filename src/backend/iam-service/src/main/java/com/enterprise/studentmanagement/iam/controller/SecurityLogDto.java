package com.enterprise.studentmanagement.iam.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for incoming security log events from other services
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecurityLogDto {
    private String ipAddress;
    private String username;
    private String action; // name of SecurityAction enum
    private String result; // name of SecurityResult enum
    private String message;
    private String userAgent;
}
