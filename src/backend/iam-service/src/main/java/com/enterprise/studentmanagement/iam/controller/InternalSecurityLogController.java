package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.entity.SecurityLog;
import com.enterprise.studentmanagement.iam.service.SecurityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal controller for receiving security log events from other services (internal use)
 */
@RestController
@RequestMapping("/internal/security")
@RequiredArgsConstructor
@Slf4j
public class InternalSecurityLogController {

    private final SecurityLogService securityLogService;

    @PostMapping("/logs")
    public ResponseEntity<Void> receiveLog(@RequestBody SecurityLogDto dto) {
        try {
            SecurityLog.SecurityAction action = SecurityLog.SecurityAction.valueOf(dto.getAction());
            SecurityLog.SecurityResult result = SecurityLog.SecurityResult.valueOf(dto.getResult());

            securityLogService.logSecurityEvent(
                    dto.getIpAddress(),
                    dto.getUsername(),
                    action,
                    result,
                    dto.getMessage(),
                    dto.getUserAgent()
            );

            return ResponseEntity.accepted().build();
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid security action/result in incoming log: {}", ex.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
