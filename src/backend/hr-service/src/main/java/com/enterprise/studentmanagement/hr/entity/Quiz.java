package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Quiz entity (Bài trắc nghiệm).
 * Một bài trắc nghiệm gắn với một lớp học phần (lop_hoc). Giáo viên tạo, sinh viên
 * đã đăng ký lớp vào làm. Câu hỏi lưu ở {@link QuizQuestion}, lượt làm ở {@link QuizAttempt}.
 */
@Entity
@Table(name = "bai_trac_nghiem", indexes = {
    @Index(name = "idx_btn_lop_hoc", columnList = "lop_hoc_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "lop_hoc_id", nullable = false)
    private UUID classId;

    @Column(name = "giang_vien_id")
    private UUID teacherId;

    @Column(name = "tieu_de", nullable = false, length = 200)
    private String title;

    @Column(name = "mo_ta", length = 1000)
    private String description;

    /** Số câu bốc ngẫu nhiên mỗi lượt làm; null hoặc >= tổng số câu bật => dùng tất cả. */
    @Column(name = "so_cau_moi_de")
    private Integer questionsPerAttempt;

    /** Giới hạn thời gian (phút); null = không giới hạn. */
    @Column(name = "gioi_han_phut")
    private Integer timeLimitMinutes;

    @Column(name = "thang_diem", columnDefinition = "numeric")
    @Builder.Default
    private Double maxScore = 10.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private QuizStatus status = QuizStatus.NHAP;

    public enum QuizStatus {
        NHAP,          // nháp - chưa cho SV thấy
        DA_XUAT_BAN,   // đã xuất bản - SV làm được
        DONG           // đã đóng - không cho làm nữa
    }
}
