package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

import java.util.UUID;

/**
 * Request DTO for assigning / unassigning a student's academic advisor.
 * advisorId = teacher UUID to assign, or null to remove the student from the
 * advisor's class (unset giao_vien_co_van_id).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAdvisorRequest {

    /** Teacher UUID to set as advisor, or null to unassign. */
    private UUID advisorId;
}
