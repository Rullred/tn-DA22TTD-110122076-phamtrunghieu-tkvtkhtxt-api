package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.UUID;

/**
 * Một dòng kết quả trong bảng điểm bài trắc nghiệm (mỗi SV, điểm cao nhất).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizResultRowDto {
    private UUID studentId;
    private String studentName;
    private String studentCode;
    private Integer attemptCount;
    private Double bestScore;
}
