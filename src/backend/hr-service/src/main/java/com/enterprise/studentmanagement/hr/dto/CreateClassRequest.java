package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO for creating a new class
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateClassRequest {

    /** Mã lớp do người tạo đặt (tùy chọn). Bỏ trống thì hệ thống tự sinh. */
    @Size(max = 20, message = "Class code must not exceed 20 characters")
    private String classCode;

    @NotBlank(message = "Class name is required")
    @Size(min = 1, max = 100, message = "Class name must be between 1 and 100 characters")
    private String className;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Teacher ID is required")
    private java.util.UUID teacherId;

    @NotBlank(message = "Subject is required")
    @Size(max = 100, message = "Subject must not exceed 100 characters")
    private String subject;

    @Size(max = 50, message = "Room must not exceed 50 characters")
    private String room;

    @NotNull(message = "Maximum students is required")
    @Min(value = 1, message = "Maximum students must be at least 1")
    @Max(value = 100, message = "Maximum students must not exceed 100")
    private Integer maxStudents;

    @Size(max = 200, message = "Schedule must not exceed 200 characters")
    private String schedule;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotBlank(message = "Academic year is required")
    @Size(max = 20, message = "Academic year must not exceed 20 characters")
    private String academicYear;

    // Học kỳ theo chương trình khung (1-8), khớp với chuong_trinh_khung.hoc_ky
    // để đối chiếu tiến độ học tập; không giới hạn 1-3 như học kỳ trong năm.
    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 8, message = "Semester must not exceed 8")
    private Integer semester;
}
