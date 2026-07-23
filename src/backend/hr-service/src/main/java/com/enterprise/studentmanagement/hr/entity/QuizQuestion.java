package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Quiz question entity (Câu hỏi trắc nghiệm).
 * Thuộc một {@link Quiz}. Các lựa chọn nằm ở {@link QuizChoice}.
 * {@code enabled=false} => câu bị tắt, không đưa vào ngân hàng bốc đề.
 */
@Entity
@Table(name = "cau_hoi_trac_nghiem", indexes = {
    @Index(name = "idx_chtn_bai", columnList = "bai_trac_nghiem_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "bai_trac_nghiem_id", nullable = false)
    private UUID quizId;

    @Column(name = "noi_dung", nullable = false, length = 2000)
    private String content;

    @Column(name = "thu_tu", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(name = "kich_hoat", nullable = false)
    @Builder.Default
    private Boolean enabled = true;
}
