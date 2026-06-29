package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for enrolling a student in a class
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollStudentRequest {

    @NotNull(message = "Student ID is required")
    private java.util.UUID studentId;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
