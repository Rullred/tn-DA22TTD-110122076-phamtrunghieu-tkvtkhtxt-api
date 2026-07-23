package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO để phân nhiều sinh viên vào một lớp cố vấn cùng lúc.
 * Gán advisorId (GV cố vấn) và lopHanhChinh (mã lớp) cho tất cả studentIds.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAssignRequest {

    @NotEmpty(message = "Danh sách sinh viên không được để trống")
    private List<UUID> studentIds;

    /** GV cố vấn để gán; null = bỏ cố vấn. */
    private UUID advisorId;

    /** Mã lớp hành chính (cohort); null/blank = không đổi cohort. */
    private String lopHanhChinh;
}
