-- V7: Learning module (hoc tap kieu LMS) for course sections.
-- Teachers post materials (TAI_LIEU) and assignments (BAI_TAP); students submit files.
-- Assignment grades live here and do NOT flow into the gradebook (diem la chuc nang rieng).
-- Placed in iam-service because iam owns every migration of the shared database. ASCII-only.

-- muc_hoc_tap (learning item)
CREATE TABLE IF NOT EXISTS muc_hoc_tap (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lop_hoc_id     UUID         NOT NULL,
    loai           VARCHAR(20)  NOT NULL,           -- TAI_LIEU | BAI_TAP
    tieu_de        VARCHAR(200) NOT NULL,
    mo_ta          TEXT,
    thu_tu         INTEGER      NOT NULL DEFAULT 0,
    hien_thi       BOOLEAN      NOT NULL DEFAULT TRUE,
    han_nop        TIMESTAMP,                        -- BAI_TAP only
    diem_toi_da    NUMERIC,                          -- BAI_TAP only
    ngay_tao       TIMESTAMP    NOT NULL DEFAULT NOW(),
    ngay_cap_nhat  TIMESTAMP,
    nguoi_tao      VARCHAR(100),
    nguoi_cap_nhat VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_mht_lop_hoc ON muc_hoc_tap(lop_hoc_id);

-- tep_hoc_lieu (attachment: file on disk OR external link)
CREATE TABLE IF NOT EXISTS tep_hoc_lieu (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    muc_id      UUID          NOT NULL REFERENCES muc_hoc_tap(id) ON DELETE CASCADE,
    ten_file    VARCHAR(255)  NOT NULL,
    duong_dan   VARCHAR(500),                        -- stored path (null if link)
    lien_ket    VARCHAR(1000),                       -- external link (null if file)
    loai_file   VARCHAR(100),
    kich_thuoc  BIGINT,
    ngay_tao    TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_thl_muc ON tep_hoc_lieu(muc_id);

-- bai_nop_hoc_tap (student submission; one per student per assignment)
CREATE TABLE IF NOT EXISTS bai_nop_hoc_tap (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    muc_id      UUID          NOT NULL REFERENCES muc_hoc_tap(id) ON DELETE CASCADE,
    sinh_vien_id UUID         NOT NULL,
    ten_file    VARCHAR(255)  NOT NULL,
    duong_dan   VARCHAR(500)  NOT NULL,
    loai_file   VARCHAR(100),
    kich_thuoc  BIGINT,
    ngay_nop    TIMESTAMP     NOT NULL DEFAULT NOW(),
    nop_tre     BOOLEAN       NOT NULL DEFAULT FALSE,
    diem        NUMERIC,
    nhan_xet    TEXT,
    nguoi_cham  UUID,
    ngay_cham   TIMESTAMP,
    CONSTRAINT uq_bnht_muc_sv UNIQUE (muc_id, sinh_vien_id)
);
CREATE INDEX IF NOT EXISTS idx_bnht_muc ON bai_nop_hoc_tap(muc_id);
CREATE INDEX IF NOT EXISTS idx_bnht_sv  ON bai_nop_hoc_tap(sinh_vien_id);
