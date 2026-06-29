package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.ClassEnrollment;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for updating an enrollment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEnrollmentRequest {

    private ClassEnrollment.EnrollmentStatus status;

    // Detailed grading system
    @Min(value = 1, message = "Credits must be at least 1")
    @Max(value = 10, message = "Credits must not exceed 10")
    private Integer credits;

    @DecimalMin(value = "0.0", message = "Component grade 1 must be at least 0")
    @DecimalMax(value = "10.0", message = "Component grade 1 must not exceed 10")
    private Double componentGrade1; // ĐTK L1

    @DecimalMin(value = "0.0", message = "Component grade 2 must be at least 0")
    @DecimalMax(value = "10.0", message = "Component grade 2 must not exceed 10")
    private Double componentGrade2; // ĐTK L2

    @DecimalMin(value = "0.0", message = "Final exam grade must be at least 0")
    @DecimalMax(value = "10.0", message = "Final exam grade must not exceed 10")
    private Double finalExamGrade; // T3

    // Legacy fields (backward compatibility)
    @Pattern(regexp = "^[A-F]\\+?$", message = "Grade must be A, B, C, D, or F, optionally followed by +")
    private String grade;

    @Min(value = 0, message = "Attendance rate must be at least 0")
    @Max(value = 100, message = "Attendance rate must not exceed 100")
    private Double attendanceRate;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
