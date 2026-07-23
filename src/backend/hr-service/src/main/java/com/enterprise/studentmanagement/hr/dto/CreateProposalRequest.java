package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * GV gửi đề xuất đăng ký dạy một môn. Tác giả (id/tên) do FE đã xác thực truyền lên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProposalRequest {
    private UUID teacherId;
    private String teacherName;

    @NotBlank(message = "Môn học là bắt buộc")
    private String subject;

    private String className;
    private String classCode;
    private String description;
    private String room;
    private Integer maxStudents;
    private String schedule;
    private String academicYear;
    private Integer semester;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
}
