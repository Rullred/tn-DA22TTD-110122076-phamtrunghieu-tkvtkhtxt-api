-- ============================================
-- SỬA LỖI ENCODING TIẾNG VIỆT TRONG DATABASE
-- ============================================

-- Bước 1: Kiểm tra charset hiện tại của database
SHOW CREATE DATABASE student_management;

-- Bước 2: Kiểm tra charset của bảng lop_hoc
SHOW CREATE TABLE lop_hoc;

-- Bước 3: Xem dữ liệu hiện tại (bị lỗi encoding)
SELECT ma_lop, ten_lop, loai_lop FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH';

-- ============================================
-- GIẢI PHÁP 1: Chuyển đổi database và bảng sang UTF8MB4
-- ============================================

-- Bước 4: Chuyển database sang utf8mb4
ALTER DATABASE student_management CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bước 5: Chuyển bảng lop_hoc sang utf8mb4
ALTER TABLE lop_hoc CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bước 6: Chuyển cột ten_lop sang utf8mb4 (đảm bảo)
ALTER TABLE lop_hoc MODIFY COLUMN ten_lop VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE lop_hoc MODIFY COLUMN mo_ta TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- GIẢI PHÁP 2: Xóa và tạo lại dữ liệu với encoding đúng
-- ============================================

-- Bước 7: Xóa dữ liệu cũ (bị lỗi encoding)
DELETE FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH';

-- Bước 8: Insert lại với encoding đúng
SET NAMES utf8mb4;

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

-- Bước 9: Kiểm tra lại (phải hiển thị đúng tiếng Việt)
SELECT ma_lop, ten_lop, loai_lop FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH';

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
-- NẾU VẪN BỊ LỖI - KIỂM TRA APPLICATION.YML
-- ============================================

-- File: backend/hr-service/src/main/resources/application.yml
-- Đảm bảo có cấu hình:
--
-- spring:
--   datasource:
--     url: jdbc:mysql://localhost:3306/student_management?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
--     driver-class-name: com.mysql.cj.jdbc.Driver
--   jpa:
--     properties:
--       hibernate:
--         dialect: org.hibernate.dialect.MySQL8Dialect
--         jdbc:
--           charset: utf8mb4
--           time_zone: Asia/Ho_Chi_Minh

