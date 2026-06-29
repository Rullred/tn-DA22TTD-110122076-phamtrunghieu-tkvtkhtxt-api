package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Class Enrollment Entity
 * Represents student enrollment in a class
 */
@Entity
@Table(name = "dang_ky_lop_hoc", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"lop_hoc_id", "sinh_vien_id"}),
    indexes = {
        @Index(name = "idx_dang_ky_lop_hoc_lop_hoc_id", columnList = "lop_hoc_id"),
        @Index(name = "idx_dang_ky_lop_hoc_sinh_vien_id", columnList = "sinh_vien_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEnrollment {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "lop_hoc_id", nullable = false)
    private UUID classId;

    @Column(name = "sinh_vien_id", nullable = false)
    private UUID studentId;

    @Column(name = "ngay_dang_ky", nullable = false)
    @Builder.Default
    private LocalDateTime enrollmentDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.DA_DANG_KY;

    // Detailed grading system
    @Column(name = "so_tin_chi")
    @Builder.Default
    private Integer credits = 3;

    @Column(name = "diem_thanh_phan_1", columnDefinition = "numeric")
    private Double componentGrade1;

    @Column(name = "diem_thanh_phan_2", columnDefinition = "numeric")
    private Double componentGrade2;

    @Column(name = "diem_thi_cuoi_ky", columnDefinition = "numeric")
    private Double finalExamGrade;

    @Column(name = "diem_tong_ket_10", columnDefinition = "numeric")
    private Double totalGrade10;

    @Column(name = "diem_tong_ket_4", columnDefinition = "numeric")
    private Double totalGrade4;

    @Column(name = "diem_chu", length = 5)
    private String letterGrade;

    // Legacy fields (kept for backward compatibility)
    @Column(name = "diem", length = 10)
    private String grade;

    @Column(name = "ty_le_diem_danh")
    private Double attendanceRate;

    @Column(name = "ghi_chu", length = 500)
    private String notes;

    @Column(name = "ngay_bo_hoc")
    private LocalDateTime droppedAt;

    public enum EnrollmentStatus {
        DA_DANG_KY,
        DA_HOAN_THANH,
        DA_BO_HOC,
        THAT_BAI
    }
}
