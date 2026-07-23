package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Cập nhật mục học tập (chỉ trường khác null mới áp dụng).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateItemRequest {
    private String title;
    private String description;
    private Boolean visible;
    private Integer orderIndex;
    private LocalDateTime dueDate;
    private Double maxScore;
}
