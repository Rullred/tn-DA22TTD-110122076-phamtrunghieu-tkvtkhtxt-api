-- ============================================
-- SỬA LỖI ENCODING TIẾNG VIỆT TRONG POSTGRESQL
-- ============================================

-- Bước 1: Kiểm tra encoding hiện tại của database
SELECT datname, pg_encoding_to_char(encoding) AS encoding 
FROM pg_database 
WHERE datname = 'student_management_db';

-- Bước 2: Kiểm tra dữ liệu hiện tại (bị lỗi encoding)
SELECT ma_lop, ten_lop, loai_lop 
FROM lop_hoc 
WHERE loai_lop = 'LOP_HANH_CHINH'
ORDER BY ma_lop;

-- ============================================
-- GIẢI PHÁP: Xóa và tạo lại dữ liệu với encoding đúng
-- ============================================

-- Bước 3: Xóa dữ liệu cũ (bị lỗi encoding)
DELETE FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH';

-- Bước 4: Insert lại với encoding đúng
-- PostgreSQL mặc định sử dụng UTF-8, nên không cần SET NAMES

-- Khóa 2022 (K22)
INSERT INTO lop_hoc (
  ma_lop, ten_lop, loai_lop, trang_thai, nam_hoc, hoc_ky, 
  so_sinh_vien_toi_da, so_sinh_vien_hien_tai, mo_ta, ngay_tao
) VALUES
  ('DA22TTD', 'Lớp K22 Công nghệ thông tin D', 'LOP_HANH_CHINH', 'HOAT_DONG', '2022-2026', 1, 45, 0, 'Lớp hành chính khóa 2022', NOW()),
  ('DA22TTA', 'Lớp K22 Công nghệ thông tin A', 'LOP_HANH_CHINH', 'HOAT_DONG', '2022-2026', 1, 40, 0, 'Lớp hành chính khóa 2022', NOW()),
  ('DA22TTB', 'Lớp K22 Công nghệ thông tin B', 'LOP_HANH_CHINH', 'HOAT_DONG', '2022-2026', 1, 40, 0, 'Lớp hành chính khóa 2022', NOW()),
  ('DA22TTC', 'Lớp K22 Công nghệ thông tin C', 'LOP_HANH_CHINH', 'HOAT_DONG', '2022-2026', 1, 40, 0, 'Lớp hành chính khóa 2022', NOW());

-- Khóa 2023 (K23)
INSERT INTO lop_hoc (
  ma_lop, ten_lop, loai_lop, trang_thai, nam_hoc, hoc_ky, 
  so_sinh_vien_toi_da, so_sinh_vien_hien_tai, mo_ta, ngay_tao
) VALUES
  ('DA23CNTT', 'Lớp K23 Công nghệ thông tin', 'LOP_HANH_CHINH', 'HOAT_DONG', '2023-2027', 1, 50, 0, 'Lớp hành chính khóa 2023', NOW()),
  ('DA23TTNT', 'Lớp K23 Trí tuệ nhân tạo', 'LOP_HANH_CHINH', 'HOAT_DONG', '2023-2027', 1, 30, 0, 'Lớp hành chính khóa 2023', NOW()),
  ('DA23KTMT', 'Lớp K23 Kỹ thuật máy tính', 'LOP_HANH_CHINH', 'HOAT_DONG', '2023-2027', 1, 35, 0, 'Lớp hành chính khóa 2023', NOW());

-- Khóa 2024 (K24)
INSERT INTO lop_hoc (
  ma_lop, ten_lop, loai_lop, trang_thai, nam_hoc, hoc_ky, 
  so_sinh_vien_toi_da, so_sinh_vien_hien_tai, mo_ta, ngay_tao
) VALUES
  ('DA24AI', 'Lớp K24 Trí tuệ nhân tạo', 'LOP_HANH_CHINH', 'HOAT_DONG', '2024-2028', 1, 35, 0, 'Lớp hành chính khóa 2024', NOW()),
  ('DA24CNTT', 'Lớp K24 Công nghệ thông tin', 'LOP_HANH_CHINH', 'HOAT_DONG', '2024-2028', 1, 45, 0, 'Lớp hành chính khóa 2024', NOW()),
  ('DA24DS', 'Lớp K24 Data Science', 'LOP_HANH_CHINH', 'HOAT_DONG', '2024-2028', 1, 30, 0, 'Lớp hành chính khóa 2024', NOW());

-- Khóa 2025 (K25)
INSERT INTO lop_hoc (
  ma_lop, ten_lop, loai_lop, trang_thai, nam_hoc, hoc_ky, 
  so_sinh_vien_toi_da, so_sinh_vien_hien_tai, mo_ta, ngay_tao
) VALUES
  ('DA25CNTT', 'Lớp K25 Công nghệ thông tin', 'LOP_HANH_CHINH', 'HOAT_DONG', '2025-2029', 1, 40, 0, 'Lớp hành chính khóa 2025', NOW()),
  ('DA25AI', 'Lớp K25 Trí tuệ nhân tạo', 'LOP_HANH_CHINH', 'HOAT_DONG', '2025-2029', 1, 35, 0, 'Lớp hành chính khóa 2025', NOW()),
  ('DA25CYBER', 'Lớp K25 An toàn thông tin', 'LOP_HANH_CHINH', 'HOAT_DONG', '2025-2029', 1, 30, 0, 'Lớp hành chính khóa 2025', NOW());

-- Bước 5: Kiểm tra lại (phải hiển thị đúng tiếng Việt)
SELECT ma_lop, ten_lop, loai_lop 
FROM lop_hoc 
WHERE loai_lop = 'LOP_HANH_CHINH'
ORDER BY ma_lop;

-- ============================================
-- KIỂM TRA KẾT QUẢ
-- ============================================

-- Kết quả mong đợi:
-- ma_lop    | ten_lop                         | loai_lop
-- ----------|---------------------------------|------------------
-- DA22TTA   | Lớp K22 Công nghệ thông tin A  | LOP_HANH_CHINH
-- DA22TTB   | Lớp K22 Công nghệ thông tin B  | LOP_HANH_CHINH
-- DA22TTC   | Lớp K22 Công nghệ thông tin C  | LOP_HANH_CHINH
-- DA22TTD   | Lớp K22 Công nghệ thông tin D  | LOP_HANH_CHINH
-- DA23CNTT  | Lớp K23 Công nghệ thông tin    | LOP_HANH_CHINH
-- DA23KTMT  | Lớp K23 Kỹ thuật máy tính      | LOP_HANH_CHINH
-- DA23TTNT  | Lớp K23 Trí tuệ nhân tạo       | LOP_HANH_CHINH
-- DA24AI    | Lớp K24 Trí tuệ nhân tạo       | LOP_HANH_CHINH
-- DA24CNTT  | Lớp K24 Công nghệ thông tin    | LOP_HANH_CHINH
-- DA24DS    | Lớp K24 Data Science           | LOP_HANH_CHINH
-- DA25AI    | Lớp K25 Trí tuệ nhân tạo       | LOP_HANH_CHINH
-- DA25CNTT  | Lớp K25 Công nghệ thông tin    | LOP_HANH_CHINH
-- DA25CYBER | Lớp K25 An toàn thông tin      | LOP_HANH_CHINH

-- ============================================
-- THỐNG KÊ
-- ============================================

SELECT 
  loai_lop,
  COUNT(*) as tong_lop
FROM lop_hoc
GROUP BY loai_lop;

-- Kết quả mong đợi:
-- loai_lop         | tong_lop
-- -----------------|----------
-- LOP_HANH_CHINH   | 13
-- LOP_HOC_PHAN     | (số lượng lớp môn học còn lại)

