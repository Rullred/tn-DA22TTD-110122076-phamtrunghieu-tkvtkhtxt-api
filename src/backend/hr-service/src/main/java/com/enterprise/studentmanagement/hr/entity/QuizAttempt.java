package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Quiz attempt entity (Bài làm trắc nghiệm).
 * Một lượt sinh viên làm một {@link Quiz}. SV được làm nhiều lần; điểm lấy cao nhất.
 * Không lưu chi tiết từng câu trả lời — chấm ngay lúc nộp từ payload gửi lên.
 */
@Entity
@Table(name = "bai_lam_trac_nghiem", indexes = {
    @Index(name = "idx_bltn_bai", columnList = "bai_trac_nghiem_id"),
    @Index(name = "idx_bltn_sv", columnList = "sinh_vien_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "bai_trac_nghiem_id", nullable = false)
    private UUID quizId;

    @Column(name = "sinh_vien_id", nullable = false)
    private UUID studentId;

    @Column(name = "diem", columnDefinition = "numeric")
    private Double score;

    @Column(name = "so_cau_dung")
    private Integer correctCount;

    @Column(name = "so_cau_hoi")
    private Integer questionCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private AttemptStatus status = AttemptStatus.DANG_LAM;

    @Column(name = "ngay_bat_dau", nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "ngay_nop")
    private LocalDateTime submittedAt;

    public enum AttemptStatus {
        DANG_LAM,   // đang làm
        DA_NOP      // đã nộp
    }
}
