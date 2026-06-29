package com.enterprise.studentmanagement.iam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Security Log Entity
 * Stores security-related events for audit and monitoring
 */
@Entity
@Table(name = "nhat_ky_bao_mat", indexes = {
    @Index(name = "idx_nhat_ky_bao_mat_ten_dang_nhap", columnList = "ten_dang_nhap"),
    @Index(name = "idx_nhat_ky_bao_mat_dia_chi_ip", columnList = "dia_chi_ip"),
    @Index(name = "idx_nhat_ky_bao_mat_hanh_dong", columnList = "hanh_dong"),
    @Index(name = "idx_nhat_ky_bao_mat_ket_qua", columnList = "ket_qua"),
    @Index(name = "idx_nhat_ky_bao_mat_ngay_tao", columnList = "ngay_tao")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityLog {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "nguoi_dung_id")
    private UUID userId;

    @Column(name = "dia_chi_ip", length = 45)
    private String ipAddress;

    @Column(name = "ten_dang_nhap", length = 50)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "hanh_dong", nullable = false, length = 50)
    private SecurityAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "ket_qua", nullable = false, length = 20)
    private SecurityResult result;

    @Column(name = "thong_bao", length = 500)
    private String message;

    @Column(name = "trinh_duyet", length = 255)
    private String userAgent;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Security Action Types
     */
    public enum SecurityAction {
        LOGIN_ATTEMPT,
        LOGIN_SUCCESS,
        LOGIN_FAILED,
        LOGOUT,
        TOKEN_REFRESH,
        TOKEN_REVOKED,
        ACCOUNT_LOCKED,
        ACCOUNT_UNLOCKED,
        IP_BLOCKED,
        IP_UNBLOCKED,
        PASSWORD_CHANGED,
        REGISTRATION,
        UNAUTHORIZED_ACCESS
    }

    /**
     * Security Result Types
     */
    public enum SecurityResult {
        SUCCESS,
        FAILURE,
        WARNING,
        INFO
    }
}
