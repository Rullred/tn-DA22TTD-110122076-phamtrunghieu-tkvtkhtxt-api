package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Đề xuất giảng dạy (teaching proposal): GV đề xuất mở lớp một môn, Admin duyệt (tạo lop_hoc)
 * hoặc từ chối. Trước đây chỉ lưu localStorage nên Admin không thấy — nay lưu ở DB.
 */
@Entity
@Table(name = "de_xuat_day", indexes = {
    @Index(name = "idx_dxd_trang_thai", columnList = "trang_thai"),
    @Index(name = "idx_dxd_giang_vien", columnList = "giang_vien_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachingProposal {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "giang_vien_id")
    private UUID teacherId;

    @Column(name = "giang_vien_ten", length = 150)
    private String teacherName;

    @Column(name = "mon_hoc", nullable = false, length = 200)
    private String subject;

    @Column(name = "ten_lop", length = 200)
    private String className;

    @Column(name = "ma_lop", length = 50)
    private String classCode;

    @Column(name = "mo_ta", columnDefinition = "text")
    private String description;

    @Column(name = "phong_hoc", length = 100)
    private String room;

    @Column(name = "so_sinh_vien_toi_da")
    private Integer maxStudents;

    @Column(name = "lich_hoc", length = 255)
    private String schedule;

    @Column(name = "nam_hoc", length = 20)
    private String academicYear;

    @Column(name = "hoc_ky")
    private Integer semester;

    @Column(name = "ngay_bat_dau")
    private LocalDate startDate;

    @Column(name = "ngay_ket_thuc")
    private LocalDate endDate;

    @Column(name = "ghi_chu", columnDefinition = "text")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.CHO_DUYET;

    @Column(name = "ly_do_tu_choi", columnDefinition = "text")
    private String rejectionReason;

    @Column(name = "lop_hoc_id")
    private UUID classId;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime updatedAt;

    public enum ProposalStatus {
        CHO_DUYET,  // chờ duyệt
        DA_DUYET,   // đã duyệt (đã tạo lớp)
        TU_CHOI     // từ chối
    }
}
