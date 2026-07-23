-- V5: Them lop hanh chinh (cohort) cho sinh vien.
-- Dung de phan sinh vien vao "lop co van" (nhan lop, VD: DA22TTD).
-- Dat trong iam-service vi iam so huu moi migration cua database dung chung.

ALTER TABLE sinh_vien ADD COLUMN IF NOT EXISTS lop_hanh_chinh VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_sinh_vien_lop_hanh_chinh ON sinh_vien(lop_hanh_chinh);

COMMENT ON COLUMN sinh_vien.lop_hanh_chinh IS 'Ma lop hanh chinh / cohort (VD: DA22TTD)';
