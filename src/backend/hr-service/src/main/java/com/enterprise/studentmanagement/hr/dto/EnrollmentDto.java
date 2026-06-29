package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.ClassEnrollment;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Enrollment Data Transfer Object
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDto {

    private UUID id;
    private UUID classId;
    private String className;
    private UUID studentId;
    private String studentName;
    private String studentCode;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime enrollmentDate;
    
    private String status;
    
    // Detailed grading system
    private Integer credits;
    private Double componentGrade1; // ĐTK L1
    private Double componentGrade2; // ĐTK L2
    private Double finalExamGrade;  // T3
    private Double totalGrade10;    // Điểm TK (10)
    private Double totalGrade4;     // Điểm TK (4)
    private String letterGrade;     // Điểm TK (C)
    
    // Legacy fields
    private String grade;
    private Double attendanceRate;
    private String notes;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime droppedAt;

    /**
     * Convert entity to DTO
     */
    public static EnrollmentDto fromEntity(ClassEnrollment enrollment) {
        if (enrollment == null) {
            return null;
        }
        
        return EnrollmentDto.builder()
                .id(enrollment.getId())
                .classId(enrollment.getClassId())
                .studentId(enrollment.getStudentId())
                .enrollmentDate(enrollment.getEnrollmentDate())
                .status(enrollment.getStatus() != null ? enrollment.getStatus().name() : null)
                // Detailed grading
                .credits(enrollment.getCredits())
                .componentGrade1(enrollment.getComponentGrade1())
                .componentGrade2(enrollment.getComponentGrade2())
                .finalExamGrade(enrollment.getFinalExamGrade())
                .totalGrade10(enrollment.getTotalGrade10())
                .totalGrade4(enrollment.getTotalGrade4())
                .letterGrade(enrollment.getLetterGrade())
                // Legacy fields
                .grade(enrollment.getGrade())
                .attendanceRate(enrollment.getAttendanceRate())
                .notes(enrollment.getNotes())
                .droppedAt(enrollment.getDroppedAt())
                .build();
    }
}
