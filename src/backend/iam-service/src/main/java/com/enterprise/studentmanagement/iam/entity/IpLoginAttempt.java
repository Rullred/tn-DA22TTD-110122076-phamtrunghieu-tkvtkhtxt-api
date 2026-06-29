package com.enterprise.studentmanagement.iam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "thu_dang_nhap_ip")
public class IpLoginAttempt {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "dia_chi_ip", nullable = false, unique = true, length = 45)
    private String ipAddress;

    @Column(name = "so_lan_that_bai", nullable = false)
    private int failedAttempts;

    @Column(name = "lan_that_bai_cuoi")
    private Instant lastFailedAt;

    public UUID getId() {
        return id;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public Instant getLastFailedAt() {
        return lastFailedAt;
    }

    public void setLastFailedAt(Instant lastFailedAt) {
        this.lastFailedAt = lastFailedAt;
    }
}
