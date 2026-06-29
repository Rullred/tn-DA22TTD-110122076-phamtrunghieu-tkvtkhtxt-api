package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.SchoolClass;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Class Data Transfer Object
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassDto {

    private UUID id;
    private String classCode;
    private String className;
    private String description;
    private UUID teacherId;
    private String teacherName;
    private String subject;
    private String room;
    private Integer maxStudents;
    private Integer currentStudents;
    private String schedule;
    private String status;
    private String academicYear;
    private Integer semester;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private String createdBy;
    private String updatedBy;

    /**
     * Convert entity to DTO
     */
    public static ClassDto fromEntity(SchoolClass schoolClass) {
        if (schoolClass == null) {
            return null;
        }
        
        return ClassDto.builder()
                .id(schoolClass.getId())
                .classCode(schoolClass.getClassCode())
                .className(schoolClass.getClassName())
                .description(schoolClass.getDescription())
                .teacherId(schoolClass.getTeacherId())
                .subject(schoolClass.getSubject())
                .room(schoolClass.getRoom())
                .maxStudents(schoolClass.getMaxStudents())
                .currentStudents(schoolClass.getCurrentStudents())
                .schedule(schoolClass.getSchedule())
                .status(schoolClass.getStatus() != null ? schoolClass.getStatus().name() : null)
                .startDate(schoolClass.getStartDate())
                .endDate(schoolClass.getEndDate())
                .academicYear(schoolClass.getAcademicYear())
                .semester(schoolClass.getSemester())
                .createdAt(schoolClass.getCreatedAt())
                .updatedAt(schoolClass.getUpdatedAt())
                .createdBy(schoolClass.getCreatedBy())
                .updatedBy(schoolClass.getUpdatedBy())
                .build();
    }

    /**
     * Check if class is full
     */
    public boolean isFull() {
        return currentStudents != null && maxStudents != null && currentStudents >= maxStudents;
    }

    /**
     * Get available seats
     */
    public Integer getAvailableSeats() {
        if (currentStudents == null || maxStudents == null) {
            return null;
        }
        return maxStudents - currentStudents;
    }
}
