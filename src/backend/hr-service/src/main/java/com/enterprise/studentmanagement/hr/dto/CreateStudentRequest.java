package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.Student;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for creating a new student
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Student.Gender gender;

    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;

    @NotNull(message = "Enrollment date is required")
    private LocalDate enrollmentDate;
}
