package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

/**
 * Admin từ chối một đề xuất giảng dạy, kèm lý do (tùy chọn).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectProposalRequest {
    private String reason;
}
