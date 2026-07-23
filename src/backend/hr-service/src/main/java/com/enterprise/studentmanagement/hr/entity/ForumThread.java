package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Chủ đề thảo luận (forum thread) trong một lớp học phần.
 * Tác giả lưu theo tên + vai trò (loose coupling: GV/SV là 2 bảng riêng).
 */
@Entity
@Table(name = "dien_dan_chu_de", indexes = {
    @Index(name = "idx_ddcd_lop_hoc", columnList = "lop_hoc_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumThread {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "lop_hoc_id", nullable = false)
    private UUID classId;

    @Column(name = "tieu_de", nullable = false, length = 300)
    private String title;

    @Column(name = "noi_dung", columnDefinition = "text")
    private String content;

    @Column(name = "nguoi_tao_id")
    private UUID authorId;

    @Column(name = "nguoi_tao_ten", length = 150)
    private String authorName;

    @Column(name = "vai_tro", length = 20)
    private String authorRole; // GIANG_VIEN | SINH_VIEN

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime updatedAt;
}
