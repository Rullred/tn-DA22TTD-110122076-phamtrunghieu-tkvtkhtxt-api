package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.Student;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Student Data Transfer Object
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDto {

    private UUID id;
    private String studentCode;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    
    private String gender;
    private String address;
    private String avatarUrl;
    private String status;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate enrollmentDate;
    
    private String major;
    private String academicYear;
    
    // New fields
    private Integer conductScore; // Điểm rèn luyện
    private UUID advisorId; // Giáo viên cố vấn
    private String cohort; // Lớp hành chính (VD: DA22TTD)
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private String createdBy;
    private String updatedBy;

    /**
     * Convert entity to DTO
     */
    public static StudentDto fromEntity(Student student) {
        if (student == null) {
            return null;
        }
        
        return StudentDto.builder()
                .id(student.getId())
                .studentCode(student.getStudentCode())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .email(student.getEmail())
                .phoneNumber(student.getPhoneNumber())
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender() != null ? student.getGender().name() : null)
                .address(student.getAddress())
                .avatarUrl(student.getAvatarUrl())
                .status(student.getStatus() != null ? student.getStatus().name() : null)
                .enrollmentDate(student.getEnrollmentDate())
                .major(student.getMajor())
                .academicYear(student.getAcademicYear())
                .conductScore(student.getConductScore())
                .advisorId(student.getAdvisorId())
                .cohort(student.getCohort())
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .createdBy(student.getCreatedBy())
                .updatedBy(student.getUpdatedBy())
                .build();
    }

    /**
     * Get full name
     */
    public String getFullName() {
        return lastName + " " + firstName;
    }
}
