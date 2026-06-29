-- ============================================
-- TẠO LỚP HÀNH CHÍNH (ADMINISTRATIVE CLASSES)
-- Sử dụng tên bảng tiếng Việt: lop_hoc
-- ============================================

-- Bước 1: Thêm cột loai_lop (class_type) nếu chưa có
ALTER TABLE lop_hoc ADD COLUMN IF NOT EXISTS loai_lop VARCHAR(30) DEFAULT 'LOP_HOC_PHAN';

-- Bước 2: Xóa dữ liệu lớp hành chính cũ (nếu có)
DELETE FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH';

-- Bước 3: Tạo lớp hành chính cho các khóa

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

-- Bước 4: Cập nhật các lớp cũ thành LOP_HOC_PHAN
UPDATE lop_hoc 
SET loai_lop = 'LOP_HOC_PHAN' 
WHERE loai_lop IS NULL OR loai_lop NOT IN ('LOP_HANH_CHINH', 'LOP_HOC_PHAN');

-- Bước 5: Kiểm tra kết quả
SELECT 
  ma_lop, 
  ten_lop, 
  loai_lop, 
  nam_hoc, 
  so_sinh_vien_toi_da,
  trang_thai
FROM lop_hoc 
WHERE loai_lop = 'LOP_HANH_CHINH'
ORDER BY nam_hoc, ma_lop;

-- Thống kê
SELECT 
  loai_lop,
  COUNT(*) as tong_lop
FROM lop_hoc
GROUP BY loai_lop;
