package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Student Entity
 * Represents a student in the system
 */
@Entity
@Table(name = "sinh_vien", indexes = {
    @Index(name = "idx_sinh_vien_nguoi_dung_id", columnList = "nguoi_dung_id"),
    @Index(name = "idx_sinh_vien_ma_sinh_vien", columnList = "ma_sinh_vien")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "nguoi_dung_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "ma_sinh_vien", nullable = false, unique = true, length = 20)
    private String studentCode;

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

    @Column(name = "dia_chi", length = 255)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "gioi_tinh", length = 10)
    private Gender gender;

    @Column(name = "anh_dai_dien", length = 500)
    private String avatarUrl;

    @Column(name = "ngay_nhap_hoc")
    private LocalDate enrollmentDate;

    @Column(name = "chuyen_nganh", length = 100)
    private String major;

    @Column(name = "nam_hoc", length = 20)
    private String academicYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private StudentStatus status = StudentStatus.HOAT_DONG;

    @Column(name = "diem_ren_luyen")
    private Integer conductScore;

    @Column(name = "giao_vien_co_van_id")
    private UUID advisorId;

    public enum StudentStatus {
        HOAT_DONG,
        KHONG_HOAT_DONG,
        DA_TOT_NGHIEP,
        BI_DINH_CHI
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
