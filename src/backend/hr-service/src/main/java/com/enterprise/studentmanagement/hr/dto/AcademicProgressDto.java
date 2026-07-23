package com.enterprise.studentmanagement.hr.dto;

import lombok.*;

import java.util.List;

/**
 * Tiến độ học tập của một sinh viên trong một học kỳ, đối chiếu với chương trình khung.
 * status của từng môn:
 *   DA_HOC   - đã đăng ký và có điểm (đạt)
 *   DANG_HOC - đã đăng ký, chưa được chấm
 *   ROT_F    - đã đăng ký nhưng bị điểm F (rớt)
 *   NO_MON   - môn bắt buộc nhưng chưa đăng ký (nợ môn)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicProgressDto {

    private String nganh;
    private String namHoc;
    private Integer hocKy;

    private List<Item> items;

    // Tổng hợp
    private int tinChiDat;   // tín chỉ các môn đã đạt
    private int tinChiNo;    // tín chỉ các môn nợ + rớt
    private int soMonNo;     // số môn nợ (chưa đăng ký)
    private int soMonRot;    // số môn rớt (F)
    private Double gpaHocKy; // GPA hệ 4 của học kỳ (các môn có điểm)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private String maMonHoc;
        private String tenMonHoc;
        private Integer soTinChi;
        private boolean batBuoc;      // thuộc chương trình khung?
        private String status;        // DA_HOC | DANG_HOC | ROT_F | NO_MON
        private String diemChu;       // điểm chữ (nếu có)
        private Double diemTongKet10; // điểm tổng kết hệ 10 (nếu có)
        private Double diemTongKet4;  // điểm tổng kết hệ 4 (nếu có)
    }
}
