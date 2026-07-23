package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

/**
 * Yêu cầu cập nhật cấu hình bài trắc nghiệm (kể cả xuất bản/đóng qua {@code status}).
 * Chỉ các trường khác null mới được áp dụng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuizRequest {
    private String title;
    private String description;
    private Integer questionsPerAttempt;
    private Integer timeLimitMinutes;
    private Double maxScore;
    /** NHAP | DA_XUAT_BAN | DONG */
    private String status;
}
