package com.enterprise.studentmanagement.iam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * User Entity
 * Represents a user account in the system
 */
@Entity
@Table(name = "nguoi_dung", indexes = {
    @Index(name = "idx_nguoi_dung_ten_dang_nhap", columnList = "ten_dang_nhap"),
    @Index(name = "idx_nguoi_dung_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "ten_dang_nhap", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "mat_khau_ma_hoa", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "vai_tro", nullable = false, length = 20)
    private UserRole role;

    @Column(name = "bi_khoa", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "khoa_den")
    private LocalDateTime lockedUntil;

    @Column(name = "kich_hoat", nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(name = "so_lan_dang_nhap_that_bai", nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "lan_dang_nhap_cuoi")
    private LocalDateTime lastLoginAt;

    @Column(name = "ip_dang_nhap_cuoi", length = 45)
    private String lastLoginIp;

    /**
     * Check if account is currently locked
     */
    public boolean isAccountLocked() {
        if (!isLocked) {
            return false;
        }
        if (lockedUntil == null) {
            return true; // Permanently locked
        }
        return LocalDateTime.now().isBefore(lockedUntil);
    }

    /**
     * Unlock account if lock period has expired
     * NOTE: Không reset failedLoginAttempts để tiếp tục đếm tích lũy
     */
    public void unlockIfExpired() {
        if (isLocked && lockedUntil != null && LocalDateTime.now().isAfter(lockedUntil)) {
            isLocked = false;
            lockedUntil = null;
            // KHÔNG reset failedLoginAttempts - để tiếp tục đếm tích lũy
            // 5 lần → khóa 30 giây
            // 10 lần → khóa 1 phút  
            // 15 lần → khóa 1 giờ
            // 20 lần → chặn IP vĩnh viễn
        }
    }
}
