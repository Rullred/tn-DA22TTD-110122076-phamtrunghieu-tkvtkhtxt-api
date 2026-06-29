-- V5: Add detailed grading system
-- Adds support for component grades, final exam, and GPA calculations

-- Update dang_ky_lop_hoc table to add detailed grading columns
ALTER TABLE dang_ky_lop_hoc
    ADD COLUMN IF NOT EXISTS so_tin_chi INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS diem_thanh_phan_1 DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS diem_thanh_phan_2 DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS diem_thi_cuoi_ky DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS diem_tong_ket_10 DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS diem_tong_ket_4 DECIMAL(3,2),
    ADD COLUMN IF NOT EXISTS diem_chu VARCHAR(5);

-- Add conduct score and advisor to students
ALTER TABLE sinh_vien
    ADD COLUMN IF NOT EXISTS diem_ren_luyen INTEGER,
    ADD COLUMN IF NOT EXISTS giao_vien_co_van_id UUID;

-- Add foreign key for advisor
ALTER TABLE sinh_vien
    ADD CONSTRAINT fk_sinh_vien_giao_vien_co_van
    FOREIGN KEY (giao_vien_co_van_id) REFERENCES giang_vien(id)
    ON DELETE SET NULL;

-- Add index for advisor lookup
CREATE INDEX IF NOT EXISTS idx_sinh_vien_giao_vien_co_van
    ON sinh_vien(giao_vien_co_van_id);

-- Add comments
COMMENT ON COLUMN dang_ky_lop_hoc.so_tin_chi IS 'Số tín chỉ của môn học';
COMMENT ON COLUMN dang_ky_lop_hoc.diem_thanh_phan_1 IS 'Điểm thành phần lần 1 (ĐTK L1)';
COMMENT ON COLUMN dang_ky_lop_hoc.diem_thanh_phan_2 IS 'Điểm thành phần lần 2 (ĐTK L2)';
COMMENT ON COLUMN dang_ky_lop_hoc.diem_thi_cuoi_ky IS 'Điểm thi cuối kỳ (T3)';
COMMENT ON COLUMN dang_ky_lop_hoc.diem_tong_ket_10 IS 'Điểm tổng kết thang 10';
COMMENT ON COLUMN dang_ky_lop_hoc.diem_tong_ket_4 IS 'Điểm tổng kết thang 4 (GPA)';
COMMENT ON COLUMN dang_ky_lop_hoc.diem_chu IS 'Điểm chữ (A, B+, B, C+, C, D+, D, F)';
COMMENT ON COLUMN sinh_vien.diem_ren_luyen IS 'Điểm rèn luyện (0-100)';
COMMENT ON COLUMN sinh_vien.giao_vien_co_van_id IS 'Giáo viên cố vấn';
