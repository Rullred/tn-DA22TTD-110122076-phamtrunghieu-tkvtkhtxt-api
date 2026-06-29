package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

import java.util.UUID;

/**
 * DTO for available classes (for student course registration)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableClassDto {

    private UUID id;
    private String classCode;
    private String className;
    private String subject;
    private String academicYear;
    private Integer semester;
    private String teacherName;
    private String schedule;
    private String room;
    private Integer maxStudents;
    private Integer currentStudents;
    private Integer availableSlots;
    private String status;
    private boolean isEnrolled; // Whether current student is already enrolled
}
