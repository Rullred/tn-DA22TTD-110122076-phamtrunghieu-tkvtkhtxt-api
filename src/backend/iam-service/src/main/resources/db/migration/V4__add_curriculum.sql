-- V4: Chương trình khung (curriculum) — danh mục môn bắt buộc theo ngành + học kỳ.
-- Dùng để xác định sinh viên "nợ môn" (môn bắt buộc nhưng chưa đăng ký).
-- Đặt trong iam-service vì iam là nơi sở hữu mọi migration của database dùng chung.

CREATE TABLE IF NOT EXISTS chuong_trinh_khung (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nganh          VARCHAR(100) NOT NULL,
    hoc_ky         INTEGER      NOT NULL,
    ma_mon_hoc     VARCHAR(50)  NOT NULL,
    ten_mon_hoc    VARCHAR(150) NOT NULL,
    so_tin_chi     INTEGER      NOT NULL DEFAULT 3,
    ngay_tao       TIMESTAMP    NOT NULL DEFAULT NOW(),
    ngay_cap_nhat  TIMESTAMP,
    nguoi_tao      VARCHAR(100),
    nguoi_cap_nhat VARCHAR(100),
    CONSTRAINT uq_ctk_nganh_hocky_mon UNIQUE (nganh, hoc_ky, ma_mon_hoc)
);

CREATE INDEX IF NOT EXISTS idx_ctk_nganh_hocky ON chuong_trinh_khung(nganh, hoc_ky);

COMMENT ON TABLE chuong_trinh_khung IS 'Chương trình khung - môn bắt buộc theo ngành và học kỳ';

-- Seed chương trình khung ngành Công nghệ thông tin, học kỳ 1.
-- 3 môn đầu khớp các lớp đã có (SV đã đăng ký); 2 môn cuối chưa mở/đăng ký -> minh hoạ "nợ môn".
INSERT INTO chuong_trinh_khung (nganh, hoc_ky, ma_mon_hoc, ten_mon_hoc, so_tin_chi) VALUES
    ('Công nghệ thông tin', 1, 'OOP22',  'Lập trình hướng đối tượng',      3),
    ('Công nghệ thông tin', 1, 'DSA22',  'Cấu trúc dữ liệu và giải thuật', 3),
    ('Công nghệ thông tin', 1, 'DB22',   'Cơ sở dữ liệu',                  3),
    ('Công nghệ thông tin', 1, 'MATH22', 'Toán rời rạc',                   3),
    ('Công nghệ thông tin', 1, 'ENG22',  'Anh văn chuyên ngành',           2)
ON CONFLICT (nganh, hoc_ky, ma_mon_hoc) DO NOTHING;
