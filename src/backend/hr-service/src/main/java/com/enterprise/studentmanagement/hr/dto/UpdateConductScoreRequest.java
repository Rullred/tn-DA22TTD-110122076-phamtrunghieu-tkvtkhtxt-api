package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for updating student conduct score
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateConductScoreRequest {

    @NotNull(message = "Conduct score is required")
    @Min(value = 0, message = "Conduct score must be at least 0")
    @Max(value = 100, message = "Conduct score must not exceed 100")
    private Integer conductScore;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
