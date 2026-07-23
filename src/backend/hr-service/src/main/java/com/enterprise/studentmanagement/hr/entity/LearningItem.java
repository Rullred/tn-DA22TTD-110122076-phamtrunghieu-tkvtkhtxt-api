package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Mục học tập (learning item) trong một lớp học phần — kiểu Moodle.
 * loai = TAI_LIEU (tài liệu/link cho SV xem-tải) hoặc BAI_TAP (bài tập SV nộp file).
 * Tệp đính kèm nằm ở {@link LearningFile}; bài nộp ở {@link AssignmentSubmission}.
 */
@Entity
@Table(name = "muc_hoc_tap", indexes = {
    @Index(name = "idx_mht_lop_hoc", columnList = "lop_hoc_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningItem extends AuditableEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "lop_hoc_id", nullable = false)
    private UUID classId;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai", nullable = false, length = 20)
    private ItemType type;

    @Column(name = "tieu_de", nullable = false, length = 200)
    private String title;

    @Column(name = "mo_ta", columnDefinition = "text")
    private String description;

    @Column(name = "thu_tu", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(name = "hien_thi", nullable = false)
    @Builder.Default
    private Boolean visible = true;

    /** Hạn nộp (chỉ dùng cho BAI_TAP); null = không giới hạn. */
    @Column(name = "han_nop")
    private LocalDateTime dueDate;

    /** Thang điểm bài tập (chỉ dùng cho BAI_TAP). */
    @Column(name = "diem_toi_da", columnDefinition = "numeric")
    private Double maxScore;

    public enum ItemType {
        TAI_LIEU,   // tài liệu / link
        BAI_TAP     // bài tập nộp file
    }
}
