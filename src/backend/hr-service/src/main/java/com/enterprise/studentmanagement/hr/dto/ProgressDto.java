package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * Tiến độ hoàn thành khóa học của sinh viên: theo tài liệu (đánh dấu đã xem),
 * bài tập (đã nộp) và trắc nghiệm (đã làm).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProgressDto {
    private int total;
    private int completed;
    private int percent;
    private int materialsDone;
    private int materialsTotal;
    private int assignmentsDone;
    private int assignmentsTotal;
    private int quizzesDone;
    private int quizzesTotal;
}
