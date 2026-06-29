package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Teacher Entity
 * Represents a teacher in the system
 */
@Entity
@Table(name = "giang_vien", indexes = {
    @Index(name = "idx_giang_vien_nguoi_dung_id", columnList = "nguoi_dung_id"),
    @Index(name = "idx_giang_vien_ma_giang_vien", columnList = "ma_giang_vien")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "nguoi_dung_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "ma_giang_vien", nullable = false, unique = true, length = 20)
    private String teacherCode;

    @Column(name = "ten", nullable = false, length = 50)
    private String firstName;

    @Column(name = "ho", nullable = false, length = 50)
    private String lastName;

    @Column(name = "ho_ten", nullable = false, length = 101)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "ngay_sinh")
    private LocalDate dateOfBirth;

    @Column(name = "so_dien_thoai", length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "gioi_tinh", length = 10)
    private Gender gender;

    @Column(name = "khoa", length = 100)
    private String department;

    @Column(name = "anh_dai_dien", length = 500)
    private String avatarUrl;

    @Column(name = "chuyen_mon", length = 100)
    private String specialization;

    @Column(name = "dia_chi", length = 255)
    private String address;

    @Column(name = "ngay_tuyen_dung")
    private LocalDate hireDate;

    @Column(name = "phong_lam_viec", length = 100)
    private String officeLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private TeacherStatus status = TeacherStatus.HOAT_DONG;

    public enum TeacherStatus {
        HOAT_DONG,
        KHONG_HOAT_DONG,
        NGHI_PHEP,
        DA_NGHI_HUU
    }

    public enum Gender {
        NAM,
        NU,
        KHAC
    }

    @PrePersist
    @PreUpdate
    private void populateFullName() {
        String safeFirstName = firstName == null ? "" : firstName.trim();
        String safeLastName = lastName == null ? "" : lastName.trim();
        String combined = (safeLastName + " " + safeFirstName).trim();
        this.fullName = combined.isEmpty() ? null : combined;
    }
}
