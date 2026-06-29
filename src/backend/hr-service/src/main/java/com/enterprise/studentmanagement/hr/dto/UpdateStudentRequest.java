package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.Student;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO for updating a student
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentRequest {

    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    private String firstName;

    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    private String lastName;

    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private Student.Gender gender;

    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;

    private Student.StudentStatus status;
}
