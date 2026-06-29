package com.enterprise.studentmanagement.iam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Refresh Token Entity
 * Stores refresh tokens for token refresh functionality
 */
@Entity
@Table(name = "token_lam_moi", indexes = {
    @Index(name = "idx_token_lam_moi_token_ma_hoa", columnList = "token_ma_hoa"),
    @Index(name = "idx_token_lam_moi_nguoi_dung_id", columnList = "nguoi_dung_id"),
    @Index(name = "idx_token_lam_moi_het_han_luc", columnList = "het_han_luc")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "nguoi_dung_id", nullable = false)
    private UUID userId;

    @Column(name = "token_ma_hoa", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "het_han_luc", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "bi_thu_hoi", nullable = false)
    @Builder.Default
    private Boolean isRevoked = false;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "ngay_thu_hoi")
    private LocalDateTime revokedAt;

    /**
     * Check if token is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if token is valid (not expired and not revoked)
     */
    public boolean isValid() {
        return !isExpired() && !isRevoked;
    }

    /**
     * Revoke this token
     */
    public void revoke() {
        this.isRevoked = true;
        this.revokedAt = LocalDateTime.now();
    }
}
