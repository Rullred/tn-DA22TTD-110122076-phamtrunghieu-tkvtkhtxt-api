package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Tệp/đính kèm của một {@link LearningItem}.
 * Nếu {@code storagePath} != null: file thật lưu trên đĩa. Nếu {@code externalLink} != null: liên kết ngoài.
 */
@Entity
@Table(name = "tep_hoc_lieu", indexes = {
    @Index(name = "idx_thl_muc", columnList = "muc_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningFile {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "muc_id", nullable = false)
    private UUID itemId;

    @Column(name = "ten_file", nullable = false, length = 255)
    private String fileName;

    /** Đường dẫn lưu trên đĩa (tương đối trong thư mục uploads); null nếu là link. */
    @Column(name = "duong_dan", length = 500)
    private String storagePath;

    /** Liên kết ngoài; null nếu là file. */
    @Column(name = "lien_ket", length = 1000)
    private String externalLink;

    @Column(name = "loai_file", length = 100)
    private String contentType;

    @Column(name = "kich_thuoc")
    private Long size;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
