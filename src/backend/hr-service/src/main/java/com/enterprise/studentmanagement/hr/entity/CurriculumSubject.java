package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Curriculum Subject entity (Chương trình khung).
 * Một môn bắt buộc trong chương trình đào tạo của một ngành ở một học kỳ.
 */
@Entity
@Table(name = "chuong_trinh_khung",
    uniqueConstraints = @UniqueConstraint(columnNames = {"nganh", "hoc_ky", "ma_mon_hoc"}),
    indexes = @Index(name = "idx_ctk_nganh_hocky", columnList = "nganh, hoc_ky")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumSubject extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "nganh", nullable = false, length = 100)
    private String nganh;

    @Column(name = "hoc_ky", nullable = false)
    private Integer hocKy;

    @Column(name = "ma_mon_hoc", nullable = false, length = 50)
    private String maMonHoc;

    @Column(name = "ten_mon_hoc", nullable = false, length = 150)
    private String tenMonHoc;

    @Column(name = "so_tin_chi", nullable = false)
    @Builder.Default
    private Integer soTinChi = 3;

    /** Nhóm môn / chuyên ngành, VD "TT" (toàn trường). Có thể null. */
    @Column(name = "chuyen_nganh", length = 20)
    private String chuyenNganh;

    /** Môn bắt buộc trong chương trình đào tạo (đánh dấu "x"). */
    @Column(name = "mon_bat_buoc", nullable = false)
    @Builder.Default
    private Boolean monBatBuoc = false;

    @Column(name = "tong_tiet")
    private Integer tongTiet;

    @Column(name = "ly_thuyet")
    private Integer lyThuyet;

    @Column(name = "thuc_hanh")
    private Integer thucHanh;
}
