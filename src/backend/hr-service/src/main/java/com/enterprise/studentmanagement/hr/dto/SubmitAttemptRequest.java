package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Bài làm SV gửi lên khi nộp: danh sách (câu hỏi -> lựa chọn đã chọn).
 * Chấm ngay dựa trên cờ đáp án đúng trong DB.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAttemptRequest {

    private List<AnswerInput> answers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerInput {
        private UUID questionId;
        private UUID choiceId;
    }
}
