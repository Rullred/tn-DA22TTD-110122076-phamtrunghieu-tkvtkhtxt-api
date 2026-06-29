package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.Teacher;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Teacher Data Transfer Object
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDto {

    private UUID id;
    private String teacherCode;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    
    private String gender;
    private String address;
    private String avatarUrl;
    private String department;
    private String specialization;
    private String status;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate hireDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private String createdBy;
    private String updatedBy;

    /**
     * Convert entity to DTO
     */
    public static TeacherDto fromEntity(Teacher teacher) {
        if (teacher == null) {
            return null;
        }
        
        return TeacherDto.builder()
                .id(teacher.getId())
                .teacherCode(teacher.getTeacherCode())
                .firstName(teacher.getFirstName())
                .lastName(teacher.getLastName())
                .email(teacher.getEmail())
                .phoneNumber(teacher.getPhoneNumber())
                .dateOfBirth(teacher.getDateOfBirth())
                .gender(teacher.getGender() != null ? teacher.getGender().name() : null)
                .address(teacher.getAddress())
                .avatarUrl(teacher.getAvatarUrl())
                .department(teacher.getDepartment())
                .specialization(teacher.getSpecialization())
                .status(teacher.getStatus() != null ? teacher.getStatus().name() : null)
                .hireDate(teacher.getHireDate())
                .createdAt(teacher.getCreatedAt())
                .updatedAt(teacher.getUpdatedAt())
                .createdBy(teacher.getCreatedBy())
                .updatedBy(teacher.getUpdatedBy())
                .build();
    }

    /**
     * Get full name
     */
    public String getFullName() {
        return lastName + " " + firstName;
    }
}
