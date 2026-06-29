package com.enterprise.studentmanagement.iam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "danh_sach_ip_chan")
public class IpBlacklist {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "dia_chi_ip", nullable = false, unique = true, length = 45)
    private String ipAddress;

    @Column(name = "ngay_chan", nullable = false)
    private Instant blockedAt;

    @Column(name = "ly_do", length = 255)
    private String reason;

    public UUID getId() {
        return id;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Instant getBlockedAt() {
        return blockedAt;
    }

    public void setBlockedAt(Instant blockedAt) {
        this.blockedAt = blockedAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
