package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

/**
 * Phân bố xếp loại học lực toàn trường, tính từ điểm thật của sinh viên.
 * Mỗi SV được tính GPA tích lũy (trung bình có trọng số tín chỉ trên thang 4)
 * rồi phân vào 4 nhóm. totalGraded = số SV đã có ít nhất một môn có điểm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpaDistributionDto {
    private long excellentGood; // GPA >= 3.2  (Xuất sắc & Giỏi)
    private long fair;          // 2.5 - 3.19  (Khá)
    private long average;       // 2.0 - 2.49  (Trung bình)
    private long weak;          // < 2.0       (Yếu & Kém)
    private long totalGraded;   // tổng số SV đã có điểm
}
