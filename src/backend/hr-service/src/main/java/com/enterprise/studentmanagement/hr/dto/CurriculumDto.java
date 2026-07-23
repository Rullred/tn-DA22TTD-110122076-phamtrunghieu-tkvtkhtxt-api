package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.CurriculumSubject;
import lombok.*;

import java.util.UUID;

/**
 * DTO for a curriculum subject (chương trình khung).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumDto {

    private UUID id;
    private String nganh;
    private Integer hocKy;
    private String maMonHoc;
    private String tenMonHoc;
    private Integer soTinChi;
    private String chuyenNganh;
    private Boolean monBatBuoc;
    private Integer tongTiet;
    private Integer lyThuyet;
    private Integer thucHanh;

    public static CurriculumDto fromEntity(CurriculumSubject e) {
        if (e == null) return null;
        return CurriculumDto.builder()
                .id(e.getId())
                .nganh(e.getNganh())
                .hocKy(e.getHocKy())
                .maMonHoc(e.getMaMonHoc())
                .tenMonHoc(e.getTenMonHoc())
                .soTinChi(e.getSoTinChi())
                .chuyenNganh(e.getChuyenNganh())
                .monBatBuoc(e.getMonBatBuoc())
                .tongTiet(e.getTongTiet())
                .lyThuyet(e.getLyThuyet())
                .thucHanh(e.getThucHanh())
                .build();
    }
}
