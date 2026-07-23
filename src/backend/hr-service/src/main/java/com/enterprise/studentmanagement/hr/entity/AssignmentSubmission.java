package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Bài nộp của sinh viên cho một mục BAI_TAP.
 * Mỗi SV chỉ có 1 bài nộp cho mỗi bài tập (nộp lại = ghi đè). Điểm chấm nằm ngay đây,
 * KHÔNG đổ vào bảng điểm thành phần (điểm số là chức năng riêng).
 */
@Entity
@Table(name = "bai_nop_hoc_tap",
    uniqueConstraints = @UniqueConstraint(columnNames = {"muc_id", "sinh_vien_id"}),
    indexes = {
        @Index(name = "idx_bnht_muc", columnList = "muc_id"),
        @Index(name = "idx_bnht_sv", columnList = "sinh_vien_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentSubmission {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "muc_id", nullable = false)
    private UUID itemId;

    @Column(name = "sinh_vien_id", nullable = false)
    private UUID studentId;

    @Column(name = "ten_file", nullable = false, length = 255)
    private String fileName;

    @Column(name = "duong_dan", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "loai_file", length = 100)
    private String contentType;

    @Column(name = "kich_thuoc")
    private Long size;

    @Column(name = "ngay_nop", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "nop_tre", nullable = false)
    @Builder.Default
    private Boolean late = false;

    @Column(name = "diem", columnDefinition = "numeric")
    private Double grade;

    @Column(name = "nhan_xet", columnDefinition = "text")
    private String feedback;

    @Column(name = "nguoi_cham")
    private UUID gradedBy;

    @Column(name = "ngay_cham")
    private LocalDateTime gradedAt;
}
