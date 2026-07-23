-- V8: Discussion forum (dien dan) + material completion tracking for progress %.
-- Forum threads/replies per course section; hoan_thanh_muc records a student marking a
-- material as viewed (used with submissions + quiz attempts to compute course progress).
-- Placed in iam-service (owns all migrations of the shared DB). ASCII-only.

-- dien_dan_chu_de (forum thread)
CREATE TABLE IF NOT EXISTS dien_dan_chu_de (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lop_hoc_id     UUID         NOT NULL,
    tieu_de        VARCHAR(300) NOT NULL,
    noi_dung       TEXT,
    nguoi_tao_id   UUID,
    nguoi_tao_ten  VARCHAR(150),
    vai_tro        VARCHAR(20),                      -- GIANG_VIEN | SINH_VIEN
    ngay_tao       TIMESTAMP    NOT NULL DEFAULT NOW(),
    ngay_cap_nhat  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ddcd_lop_hoc ON dien_dan_chu_de(lop_hoc_id);

-- dien_dan_tra_loi (forum reply)
CREATE TABLE IF NOT EXISTS dien_dan_tra_loi (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chu_de_id      UUID         NOT NULL REFERENCES dien_dan_chu_de(id) ON DELETE CASCADE,
    noi_dung       TEXT         NOT NULL,
    nguoi_tao_id   UUID,
    nguoi_tao_ten  VARCHAR(150),
    vai_tro        VARCHAR(20),
    ngay_tao       TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ddtl_chu_de ON dien_dan_tra_loi(chu_de_id);

-- hoan_thanh_muc (student marked a material as done)
CREATE TABLE IF NOT EXISTS hoan_thanh_muc (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    muc_id        UUID       NOT NULL REFERENCES muc_hoc_tap(id) ON DELETE CASCADE,
    sinh_vien_id  UUID       NOT NULL,
    ngay_tao      TIMESTAMP  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_htm_muc_sv UNIQUE (muc_id, sinh_vien_id)
);
CREATE INDEX IF NOT EXISTS idx_htm_sv ON hoan_thanh_muc(sinh_vien_id);
