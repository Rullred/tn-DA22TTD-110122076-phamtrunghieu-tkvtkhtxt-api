package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Trả lời trong một {@link ForumThread}.
 */
@Entity
@Table(name = "dien_dan_tra_loi", indexes = {
    @Index(name = "idx_ddtl_chu_de", columnList = "chu_de_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumReply {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "chu_de_id", nullable = false)
    private UUID threadId;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "nguoi_tao_id")
    private UUID authorId;

    @Column(name = "nguoi_tao_ten", length = 150)
    private String authorName;

    @Column(name = "vai_tro", length = 20)
    private String authorRole;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
