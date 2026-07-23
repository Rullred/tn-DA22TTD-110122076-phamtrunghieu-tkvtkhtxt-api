-- Thêm 85 sinh viên mới (khóa 2022, MSSV 118022xxx) — ngành CNTT, quê Vĩnh Long.
-- Mỗi SV: 1 tài khoản nguoi_dung (username = MSSV, vai trò STUDENT, dùng chung hash mật khẩu seed)
--          + 1 dòng vai_tro_nguoi_dung + 1 hồ sơ sinh_vien.
-- Các trường còn thiếu (CCCD không có cột; ngày sinh chính xác, SĐT, lớp HC) để null/mặc định, chỉnh sau.
BEGIN;

-- 1) Tài khoản đăng nhập
INSERT INTO nguoi_dung
  (ten_dang_nhap, email, mat_khau_ma_hoa, vai_tro, bi_khoa, kich_hoat, so_lan_dang_nhap_that_bai, ngay_tao, ngay_cap_nhat, totp_enabled)
SELECT mssv, mssv || '@ts.tvu.edu.vn',
       '$2a$12$Ox81/9lafUXun39fpLHnCuoXOMfGSZ8N9K8w14LUX5LcMiBf43Qae',
       'STUDENT', false, true, 0, NOW(), NOW(), false
FROM (VALUES
 ('118022004'),('118022006'),('118022008'),('118022009'),('118022010'),('118022011'),('118022012'),('118022014'),
 ('118022018'),('118022019'),('118022020'),('118022021'),('118022022'),('118022024'),('118022027'),('118022029'),
 ('118022032'),('118022033'),('118022035'),('118022037'),('118022038'),('118022041'),('118022042'),('118022045'),
 ('118022046'),('118022047'),('118022048'),('118022049'),('118022108'),('118022109'),('118022111'),('118022112'),
 ('118022115'),('118022116'),('118022117'),
 ('118022118'),('118022119'),('118022120'),('118022121'),('118022122'),('118022123'),('118022124'),('118022125'),
 ('118022126'),('118022127'),('118022128'),('118022129'),('118022130'),('118022131'),('118022132'),('118022133'),
 ('118022134'),('118022135'),('118022136'),('118022137'),('118022138'),('118022139'),('118022140'),('118022141'),
 ('118022142'),('118022143'),('118022144'),('118022145'),('118022146'),('118022147'),('118022148'),('118022149'),
 ('118022150'),('118022151'),('118022152'),('118022153'),('118022154'),('118022155'),('118022156'),('118022157'),
 ('118022158'),('118022159'),('118022160'),('118022161'),('118022162'),('118022163'),('118022164'),('118022165'),
 ('118022166'),('118022167')
) AS t(mssv)
ON CONFLICT (ten_dang_nhap) DO NOTHING;

-- 2) Gán vai trò STUDENT (bảng nhiều-nhiều)
INSERT INTO vai_tro_nguoi_dung (nguoi_dung_id, vai_tro)
SELECT id, 'STUDENT' FROM nguoi_dung WHERE ten_dang_nhap LIKE '118022%'
ON CONFLICT (nguoi_dung_id, vai_tro) DO NOTHING;

-- 3) Hồ sơ sinh viên (ho = họ + đệm, ten = tên gọi)
INSERT INTO sinh_vien
  (nguoi_dung_id, ma_sinh_vien, ho, ten, ho_ten, email, gioi_tinh, ngay_sinh, dia_chi,
   chuyen_nganh, nam_hoc, ngay_nhap_hoc, trang_thai, ngay_tao)
SELECT nd.id, v.mssv, v.ho, v.ten, v.hoten, nd.email, 'NAM', DATE '2004-01-01', 'Vĩnh Long',
       'Công nghệ thông tin', '2022-2026', DATE '2022-09-01', 'HOAT_DONG', NOW()
FROM (VALUES
 ('118022004','Trầm Quốc','An','Trầm Quốc An'),
 ('118022006','Hồ Phúc','Bảo','Hồ Phúc Bảo'),
 ('118022008','Trần Vũ','Bảo','Trần Vũ Bảo'),
 ('118022009','Lý Văn','Bình','Lý Văn Bình'),
 ('118022010','Nguyễn Thái','Bình','Nguyễn Thái Bình'),
 ('118022011','Võ Thanh','Cần','Võ Thanh Cần'),
 ('118022012','Thạch Cao','Chí','Thạch Cao Chí'),
 ('118022014','Lê Hải','Dăng','Lê Hải Dăng'),
 ('118022018','Trần Quốc','Đạt','Trần Quốc Đạt'),
 ('118022019','Bành Kim Chí','Định','Bành Kim Chí Định'),
 ('118022020','Bùi Chính','Đức','Bùi Chính Đức'),
 ('118022021','Sơn Trọng','Đức','Sơn Trọng Đức'),
 ('118022022','Trương Minh','Đức','Trương Minh Đức'),
 ('118022024','Kim Khánh','Duy','Kim Khánh Duy'),
 ('118022027','Nguyễn Khánh','Duy','Nguyễn Khánh Duy'),
 ('118022029','Nguyễn Ngọc Trường','Giang','Nguyễn Ngọc Trường Giang'),
 ('118022032','Trịnh Xuân','Hoàng','Trịnh Xuân Hoàng'),
 ('118022033','Thạch','Hùng','Thạch Hùng'),
 ('118022035','Trần Đức','Hưng','Trần Đức Hưng'),
 ('118022037','Nguyễn Gia','Huy','Nguyễn Gia Huy'),
 ('118022038','Nguyễn Quang','Huy','Nguyễn Quang Huy'),
 ('118022041','Nguyễn Tuấn','Kha','Nguyễn Tuấn Kha'),
 ('118022042','Nguyễn Lâm Duy','Khang','Nguyễn Lâm Duy Khang'),
 ('118022045','Lâm Quốc','Khánh','Lâm Quốc Khánh'),
 ('118022046','Nguyễn Văn Duy','Khánh','Nguyễn Văn Duy Khánh'),
 ('118022047','Bùi Thanh','Khoa','Bùi Thanh Khoa'),
 ('118022048','Đỗ Đăng','Khoa','Đỗ Đăng Khoa'),
 ('118022049','Thạch Pho','Khuê','Thạch Pho Khuê'),
 ('118022108','Nguyễn Tấn','Đạt','Nguyễn Tấn Đạt'),
 ('118022109','Nguyễn Tài','Lộc','Nguyễn Tài Lộc'),
 ('118022111','Trần Vĩnh','Phát','Trần Vĩnh Phát'),
 ('118022112','Trương','Quảng','Trương Quảng'),
 ('118022115','Trần Huy','Tịnh','Trần Huy Tịnh'),
 ('118022116','Nguyễn Phúc Phương','Trí','Nguyễn Phúc Phương Trí'),
 ('118022117','Nguyễn Nhựt','Trường','Nguyễn Nhựt Trường'),
 ('118022118','Nguyễn Quốc','An','Nguyễn Quốc An'),
 ('118022119','Trần Phúc','Bảo','Trần Phúc Bảo'),
 ('118022120','Hồ Minh','Đức','Hồ Minh Đức'),
 ('118022121','Võ Quang','Huy','Võ Quang Huy'),
 ('118022122','Lê Tấn','Đạt','Lê Tấn Đạt'),
 ('118022123','Nguyễn Hải','Dăng','Nguyễn Hải Dăng'),
 ('118022124','Trương Thanh','Khoa','Trương Thanh Khoa'),
 ('118022125','Bùi Khánh','Duy','Bùi Khánh Duy'),
 ('118022126','Kim Quốc','Khánh','Kim Quốc Khánh'),
 ('118022127','Nguyễn Đức','Hưng','Nguyễn Đức Hưng'),
 ('118022128','Trần Ngọc','Giang','Trần Ngọc Giang'),
 ('118022129','Lý Minh','Bình','Lý Minh Bình'),
 ('118022130','Hồ Quốc','Đạt','Hồ Quốc Đạt'),
 ('118022131','Nguyễn Phương','Trí','Nguyễn Phương Trí'),
 ('118022132','Trương Vĩnh','Phát','Trương Vĩnh Phát'),
 ('118022133','Đỗ Thanh','Cần','Đỗ Thanh Cần'),
 ('118022134','Bùi Minh','Khoa','Bùi Minh Khoa'),
 ('118022135','Nguyễn Quảng','Trường','Nguyễn Quảng Trường'),
 ('118022136','Trần Đức','Khánh','Trần Đức Khánh'),
 ('118022137','Võ Tuấn','Kha','Võ Tuấn Kha'),
 ('118022138','Lê Cao','Chí','Lê Cao Chí'),
 ('118022139','Nguyễn Gia','Bình','Nguyễn Gia Bình'),
 ('118022140','Trần Khánh','Duy','Trần Khánh Duy'),
 ('118022141','Hồ Quốc','Huy','Hồ Quốc Huy'),
 ('118022142','Trương Phúc','Đức','Trương Phúc Đức'),
 ('118022143','Nguyễn Minh','An','Nguyễn Minh An'),
 ('118022144','Võ Huy','Khang','Võ Huy Khang'),
 ('118022145','Trần Thanh','Bình','Trần Thanh Bình'),
 ('118022146','Nguyễn Vĩnh','Đức','Nguyễn Vĩnh Đức'),
 ('118022147','Bùi Hải','Phát','Bùi Hải Phát'),
 ('118022148','Trương Quang','Trí','Trương Quang Trí'),
 ('118022149','Nguyễn Tấn','Khoa','Nguyễn Tấn Khoa'),
 ('118022150','Trần Khánh','Bình','Trần Khánh Bình'),
 ('118022151','Lê Quốc','Hưng','Lê Quốc Hưng'),
 ('118022152','Võ Minh','Khang','Võ Minh Khang'),
 ('118022153','Hồ Đức','Đạt','Hồ Đức Đạt'),
 ('118022154','Nguyễn Quang','Phát','Nguyễn Quang Phát'),
 ('118022155','Trần Gia','Duy','Trần Gia Duy'),
 ('118022156','Lý Thanh','Trường','Lý Thanh Trường'),
 ('118022157','Bùi Phúc','Khoa','Bùi Phúc Khoa'),
 ('118022158','Nguyễn Hải','Khánh','Nguyễn Hải Khánh'),
 ('118022159','Trương Quốc','Bình','Trương Quốc Bình'),
 ('118022160','Võ Minh','Huy','Võ Minh Huy'),
 ('118022161','Trần Đức','Trường','Trần Đức Trường'),
 ('118022162','Nguyễn Thanh','Đạt','Nguyễn Thanh Đạt'),
 ('118022163','Hồ Quốc','Trí','Hồ Quốc Trí'),
 ('118022164','Trương Gia','An','Trương Gia An'),
 ('118022165','Bùi Khánh','Huy','Bùi Khánh Huy'),
 ('118022166','Nguyễn Minh','Khoa','Nguyễn Minh Khoa'),
 ('118022167','Trần Quốc','Phát','Trần Quốc Phát')
) AS v(mssv, ho, ten, hoten)
JOIN nguoi_dung nd ON nd.ten_dang_nhap = v.mssv
ON CONFLICT (ma_sinh_vien) DO NOTHING;

COMMIT;

SELECT
  (SELECT COUNT(*) FROM nguoi_dung WHERE ten_dang_nhap LIKE '118022%') AS accounts,
  (SELECT COUNT(*) FROM vai_tro_nguoi_dung vr JOIN nguoi_dung nd ON nd.id=vr.nguoi_dung_id WHERE nd.ten_dang_nhap LIKE '118022%') AS roles,
  (SELECT COUNT(*) FROM sinh_vien WHERE ma_sinh_vien LIKE '118022%') AS students;
