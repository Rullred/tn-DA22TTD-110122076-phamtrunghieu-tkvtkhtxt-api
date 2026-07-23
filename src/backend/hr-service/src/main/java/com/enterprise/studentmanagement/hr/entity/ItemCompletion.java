package com.enterprise.studentmanagement.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

/**
 * Ghi nhận một sinh viên đã đánh dấu hoàn thành một mục TAI_LIEU (để tính tiến độ %).
 */
@Entity
@Table(name = "hoan_thanh_muc",
    uniqueConstraints = @UniqueConstraint(columnNames = {"muc_id", "sinh_vien_id"}),
    indexes = @Index(name = "idx_htm_sv", columnList = "sinh_vien_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemCompletion {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "muc_id", nullable = false)
    private UUID itemId;

    @Column(name = "sinh_vien_id", nullable = false)
    private UUID studentId;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
