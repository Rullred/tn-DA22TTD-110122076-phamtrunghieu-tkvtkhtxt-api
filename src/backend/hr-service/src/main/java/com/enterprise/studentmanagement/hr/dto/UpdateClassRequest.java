package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.SchoolClass;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO for updating a class
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateClassRequest {

    @Size(min = 1, max = 100, message = "Class name must be between 1 and 100 characters")
    private String className;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private java.util.UUID teacherId;

    @Size(max = 100, message = "Subject must not exceed 100 characters")
    private String subject;

    @Size(max = 50, message = "Room must not exceed 50 characters")
    private String room;

    @Min(value = 1, message = "Maximum students must be at least 1")
    @Max(value = 100, message = "Maximum students must not exceed 100")
    private Integer maxStudents;

    @Size(max = 200, message = "Schedule must not exceed 200 characters")
    private String schedule;

    private LocalDate startDate;

    private LocalDate endDate;

    private SchoolClass.ClassStatus status;

    private String academicYear;

    private Integer semester;
}
