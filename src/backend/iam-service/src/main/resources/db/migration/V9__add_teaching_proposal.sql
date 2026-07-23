-- V9: Teaching proposals (de xuat day). Teacher proposes to teach a subject; Admin approves
-- (creating a real lop_hoc) or rejects. Previously stored only in browser localStorage, so the
-- Admin never saw a teacher's proposals across accounts/machines. Now persisted server-side.
-- Placed in iam-service (owns all migrations). ASCII-only.

CREATE TABLE IF NOT EXISTS de_xuat_day (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giang_vien_id       UUID,
    giang_vien_ten      VARCHAR(150),
    mon_hoc             VARCHAR(200) NOT NULL,
    ten_lop             VARCHAR(200),
    ma_lop              VARCHAR(50),
    mo_ta               TEXT,
    phong_hoc           VARCHAR(100),
    so_sinh_vien_toi_da INTEGER,
    lich_hoc            VARCHAR(255),
    nam_hoc             VARCHAR(20),
    hoc_ky              INTEGER,
    ngay_bat_dau        DATE,
    ngay_ket_thuc       DATE,
    ghi_chu             TEXT,
    trang_thai          VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET',  -- CHO_DUYET | DA_DUYET | TU_CHOI
    ly_do_tu_choi       TEXT,
    lop_hoc_id          UUID,                                       -- created class after approval
    ngay_tao            TIMESTAMP NOT NULL DEFAULT NOW(),
    ngay_cap_nhat       TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dxd_trang_thai ON de_xuat_day(trang_thai);
CREATE INDEX IF NOT EXISTS idx_dxd_giang_vien ON de_xuat_day(giang_vien_id);
