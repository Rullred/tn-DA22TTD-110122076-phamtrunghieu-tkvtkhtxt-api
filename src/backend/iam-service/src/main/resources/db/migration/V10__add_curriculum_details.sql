-- V10: Bổ sung cột chi tiết cho chương trình khung (giống bảng CTĐT của trường):
--   chuyen_nganh  : nhóm môn (VD "TT" = toàn trường / cơ sở ngành), có thể rỗng
--   mon_bat_buoc  : môn bắt buộc (đánh dấu "x" trong CTĐT)
--   tong_tiet     : tổng số tiết
--   ly_thuyet     : số tiết lý thuyết
--   thuc_hanh     : số tiết thực hành
-- Chỉ thay đổi schema; dữ liệu curriculum được seed riêng.

ALTER TABLE chuong_trinh_khung ADD COLUMN IF NOT EXISTS chuyen_nganh VARCHAR(20);
ALTER TABLE chuong_trinh_khung ADD COLUMN IF NOT EXISTS mon_bat_buoc BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE chuong_trinh_khung ADD COLUMN IF NOT EXISTS tong_tiet INTEGER;
ALTER TABLE chuong_trinh_khung ADD COLUMN IF NOT EXISTS ly_thuyet INTEGER;
ALTER TABLE chuong_trinh_khung ADD COLUMN IF NOT EXISTS thuc_hanh INTEGER;

COMMENT ON COLUMN chuong_trinh_khung.chuyen_nganh IS 'Nhóm môn / chuyên ngành (VD TT = toàn trường)';
COMMENT ON COLUMN chuong_trinh_khung.mon_bat_buoc IS 'Môn bắt buộc trong chương trình đào tạo';
