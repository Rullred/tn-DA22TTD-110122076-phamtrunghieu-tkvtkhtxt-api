package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Quiz choice entity (Lựa chọn của câu hỏi trắc nghiệm).
 * Thuộc một {@link QuizQuestion}. {@code correct=true} là đáp án đúng.
 */
@Entity
@Table(name = "lua_chon_trac_nghiem", indexes = {
    @Index(name = "idx_lctn_cau_hoi", columnList = "cau_hoi_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizChoice {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "cau_hoi_id", nullable = false)
    private UUID questionId;

    @Column(name = "noi_dung", nullable = false, length = 1000)
    private String content;

    @Column(name = "la_dap_an_dung", nullable = false)
    @Builder.Default
    private Boolean correct = false;

    @Column(name = "thu_tu", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;
}
