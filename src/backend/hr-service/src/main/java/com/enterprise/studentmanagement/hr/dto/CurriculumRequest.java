package com.enterprise.studentmanagement.hr.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating / updating a curriculum subject.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumRequest {

    @NotBlank(message = "Ngành không được để trống")
    @Size(max = 100)
    private String nganh;

    @NotNull(message = "Học kỳ không được để trống")
    @Min(value = 1, message = "Học kỳ phải từ 1")
    @Max(value = 20, message = "Học kỳ không hợp lệ")
    private Integer hocKy;

    @NotBlank(message = "Mã môn học không được để trống")
    @Size(max = 50)
    private String maMonHoc;

    @NotBlank(message = "Tên môn học không được để trống")
    @Size(max = 150)
    private String tenMonHoc;

    @NotNull(message = "Số tín chỉ không được để trống")
    @Min(value = 1, message = "Số tín chỉ phải từ 1")
    @Max(value = 15, message = "Số tín chỉ không hợp lệ")
    private Integer soTinChi;

    @Size(max = 20)
    private String chuyenNganh;

    private Boolean monBatBuoc;

    @Min(value = 0) @Max(value = 500)
    private Integer tongTiet;

    @Min(value = 0) @Max(value = 500)
    private Integer lyThuyet;

    @Min(value = 0) @Max(value = 500)
    private Integer thucHanh;
}
