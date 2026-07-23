package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.LearningItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Mục học tập kèm tệp đính kèm. Với BAI_TAP: GV thấy {@code submissionCount}, SV thấy {@code mySubmission}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LearningItemDto {
    private UUID id;
    private UUID classId;
    private String type;              // TAI_LIEU | BAI_TAP
    private String title;
    private String description;
    private Integer orderIndex;
    private Boolean visible;
    private LocalDateTime dueDate;
    private Double maxScore;
    private List<LearningFileDto> files;
    // Bài tập
    private Integer submissionCount;  // cho GV
    private SubmissionDto mySubmission; // cho SV
    // Tiến độ (SV): mục này SV đã hoàn thành chưa (tài liệu: đã đánh dấu xem; bài tập: đã nộp)
    private Boolean completed;

    public static LearningItemDto fromEntity(LearningItem it) {
        return LearningItemDto.builder()
                .id(it.getId())
                .classId(it.getClassId())
                .type(it.getType() != null ? it.getType().name() : null)
                .title(it.getTitle())
                .description(it.getDescription())
                .orderIndex(it.getOrderIndex())
                .visible(it.getVisible())
                .dueDate(it.getDueDate())
                .maxScore(it.getMaxScore())
                .build();
    }
}
