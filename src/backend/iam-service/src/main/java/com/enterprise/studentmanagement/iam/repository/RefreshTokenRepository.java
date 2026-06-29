package com.enterprise.studentmanagement.iam.repository;

import com.enterprise.studentmanagement.iam.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Refresh Token Repository
 * Data access layer for RefreshToken entity
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /**
     * Find refresh token by token string
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Delete all refresh tokens for a user
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.userId = :userId")
    void deleteByUserId(UUID userId);

    /**
     * Delete expired tokens
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);

    /**
     * Revoke all tokens for a user
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :now WHERE rt.userId = :userId AND rt.isRevoked = false")
    void revokeAllByUserId(UUID userId, LocalDateTime now);

    /**
     * Count active tokens for a user
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.userId = :userId AND rt.isRevoked = false AND rt.expiresAt > :now")
    long countActiveTokensByUserId(UUID userId, LocalDateTime now);
}
