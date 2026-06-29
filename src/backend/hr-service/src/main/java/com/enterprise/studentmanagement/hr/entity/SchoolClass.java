package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * School Class Entity
 * Represents a class/course in the system
 * Named SchoolClass to avoid conflict with Java's Class keyword
 */
@Entity
@Table(name = "lop_hoc", indexes = {
    @Index(name = "idx_lop_hoc_ma_lop", columnList = "ma_lop"),
    @Index(name = "idx_lop_hoc_giang_vien_id", columnList = "giang_vien_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClass extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "ma_lop", nullable = false, unique = true, length = 20)
    private String classCode;

    @Column(name = "ten_lop", nullable = false, length = 100)
    private String className;

    @Column(name = "giang_vien_id")
    private UUID teacherId;

    @Column(name = "nam_hoc", nullable = false, length = 20)
    private String academicYear;

    @Column(name = "hoc_ky", nullable = false)
    private Integer semester;

    @Column(name = "mon_hoc", length = 100)
    private String subject;

    @Column(name = "phong_hoc", length = 50)
    private String room;

    @Column(name = "lich_hoc", length = 255)
    private String schedule;

    @Column(name = "so_sinh_vien_toi_da")
    private Integer maxStudents;

    @Column(name = "so_sinh_vien_hien_tai")
    @Builder.Default
    private Integer currentStudents = 0;

    @Column(name = "ngay_bat_dau")
    private java.time.LocalDate startDate;

    @Column(name = "ngay_ket_thuc")
    private java.time.LocalDate endDate;

    @Column(name = "mo_ta", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private ClassStatus status = ClassStatus.HOAT_DONG;

    public enum ClassStatus {
        HOAT_DONG,
        KHONG_HOAT_DONG,
        DA_HOAN_THANH,
        DA_HUY
    }
}
