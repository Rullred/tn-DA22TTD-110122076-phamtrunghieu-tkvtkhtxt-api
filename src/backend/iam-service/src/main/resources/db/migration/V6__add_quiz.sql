-- V6: Online quiz feature (trac nghiem online) for course sections.
-- Teachers create quizzes on a lop_hoc; students enrolled in that section take them.
-- Placed in iam-service because iam owns every migration of the shared database.
-- ASCII-only on purpose to avoid any console/encoding issues; all Vietnamese content
-- (titles, questions) is inserted at runtime via JDBC (UTF-8), not seeded here.

-- Quiz (bai_trac_nghiem)
CREATE TABLE IF NOT EXISTS bai_trac_nghiem (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lop_hoc_id        UUID         NOT NULL,
    giang_vien_id     UUID,
    tieu_de           VARCHAR(200) NOT NULL,
    mo_ta             VARCHAR(1000),
    so_cau_moi_de     INTEGER,               -- N questions drawn per attempt; NULL = all enabled
    gioi_han_phut     INTEGER,               -- time limit in minutes; NULL = none
    thang_diem        NUMERIC      NOT NULL DEFAULT 10,
    trang_thai        VARCHAR(20)  NOT NULL DEFAULT 'NHAP',  -- NHAP | DA_XUAT_BAN | DONG
    ngay_tao          TIMESTAMP    NOT NULL DEFAULT NOW(),
    ngay_cap_nhat     TIMESTAMP,
    nguoi_tao         VARCHAR(100),
    nguoi_cap_nhat    VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_btn_lop_hoc ON bai_trac_nghiem(lop_hoc_id);

-- Question (cau_hoi_trac_nghiem)
CREATE TABLE IF NOT EXISTS cau_hoi_trac_nghiem (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bai_trac_nghiem_id  UUID          NOT NULL REFERENCES bai_trac_nghiem(id) ON DELETE CASCADE,
    noi_dung            VARCHAR(2000) NOT NULL,
    thu_tu              INTEGER       NOT NULL DEFAULT 0,
    kich_hoat          BOOLEAN       NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_chtn_bai ON cau_hoi_trac_nghiem(bai_trac_nghiem_id);

-- Choice (lua_chon_trac_nghiem)
CREATE TABLE IF NOT EXISTS lua_chon_trac_nghiem (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cau_hoi_id     UUID          NOT NULL REFERENCES cau_hoi_trac_nghiem(id) ON DELETE CASCADE,
    noi_dung       VARCHAR(1000) NOT NULL,
    la_dap_an_dung BOOLEAN       NOT NULL DEFAULT FALSE,
    thu_tu         INTEGER       NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lctn_cau_hoi ON lua_chon_trac_nghiem(cau_hoi_id);

-- Attempt (bai_lam_trac_nghiem)
CREATE TABLE IF NOT EXISTS bai_lam_trac_nghiem (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bai_trac_nghiem_id  UUID        NOT NULL REFERENCES bai_trac_nghiem(id) ON DELETE CASCADE,
    sinh_vien_id        UUID        NOT NULL,
    diem                NUMERIC,
    so_cau_dung         INTEGER,
    so_cau_hoi          INTEGER,
    trang_thai          VARCHAR(20) NOT NULL DEFAULT 'DANG_LAM',  -- DANG_LAM | DA_NOP
    ngay_bat_dau        TIMESTAMP   NOT NULL DEFAULT NOW(),
    ngay_nop            TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bltn_bai ON bai_lam_trac_nghiem(bai_trac_nghiem_id);
CREATE INDEX IF NOT EXISTS idx_bltn_sv  ON bai_lam_trac_nghiem(sinh_vien_id);
