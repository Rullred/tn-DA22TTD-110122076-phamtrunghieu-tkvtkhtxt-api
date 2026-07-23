-- Nhập điểm cho SV DA22TTD ở 5 lớp B21.10x (HK1 2022-2023) với phân bố GPA đẹp:
--   ~40% Giỏi (GPA>=3.2), ~40% Khá (2.5-3.19), ~13% Trung bình (2.0-2.49), ~7% Yếu (<2.0).
-- Điểm tổng kết 10 = 0.2*TP1 + 0.3*TP2 + 0.5*Cuối kỳ; quy đổi thang 4 + điểm chữ theo GradeCalculator.
BEGIN;

WITH sv AS (
  SELECT id, random() AS r
  FROM sinh_vien WHERE lop_hanh_chinh = 'DA22TTD'
),
base AS (   -- mức điểm nền theo tier của từng sinh viên (~40% Giỏi / 40% Khá / 13% TB / 7% Yếu)
  SELECT id, CASE
    WHEN r < 0.40 THEN 8.1 + random() * 1.4   -- Giỏi:        8.1 - 9.5
    WHEN r < 0.80 THEN 6.6 + random() * 1.2   -- Khá:         6.6 - 7.8
    WHEN r < 0.93 THEN 5.7 + random() * 0.6   -- Trung bình:  5.7 - 6.3
    ELSE               4.3 + random() * 0.9   -- Yếu & Kém:   4.3 - 5.2
  END AS base10 FROM sv
),
enr AS (    -- 3 điểm thành phần dao động quanh mức nền
  SELECT dk.id,
    LEAST(10, GREATEST(0, b.base10 + (random() - 0.5))) AS c1,
    LEAST(10, GREATEST(0, b.base10 + (random() - 0.5))) AS c2,
    LEAST(10, GREATEST(0, b.base10 + (random() - 0.5))) AS fin
  FROM dang_ky_lop_hoc dk
  JOIN lop_hoc l ON l.id = dk.lop_hoc_id AND l.ma_lop LIKE 'B21.10%'
  JOIN base b ON b.id = dk.sinh_vien_id
),
calc AS (
  SELECT id, ROUND(c1::numeric, 1) c1, ROUND(c2::numeric, 1) c2, ROUND(fin::numeric, 1) fin,
    ROUND((c1 * 0.2 + c2 * 0.3 + fin * 0.5)::numeric, 2) t10
  FROM enr
)
UPDATE dang_ky_lop_hoc dk SET
  diem_thanh_phan_1 = c.c1,
  diem_thanh_phan_2 = c.c2,
  diem_thi_cuoi_ky  = c.fin,
  diem_tong_ket_10  = c.t10,
  diem_tong_ket_4 = CASE
    WHEN c.t10 >= 8.5 THEN 4.0 WHEN c.t10 >= 8.0 THEN 3.5 WHEN c.t10 >= 7.0 THEN 3.0
    WHEN c.t10 >= 6.5 THEN 2.5 WHEN c.t10 >= 5.5 THEN 2.0 WHEN c.t10 >= 5.0 THEN 1.5
    WHEN c.t10 >= 4.0 THEN 1.0 ELSE 0.0 END,
  diem_chu = CASE
    WHEN c.t10 >= 9.0 THEN 'A' WHEN c.t10 >= 8.5 THEN 'B+' WHEN c.t10 >= 8.0 THEN 'B'
    WHEN c.t10 >= 7.0 THEN 'C+' WHEN c.t10 >= 6.5 THEN 'C' WHEN c.t10 >= 5.5 THEN 'D+'
    WHEN c.t10 >= 5.0 THEN 'D' ELSE 'F' END,
  trang_thai = CASE WHEN c.t10 >= 5.0 THEN 'DA_HOAN_THANH' ELSE 'THAT_BAI' END
FROM calc c WHERE dk.id = c.id;

COMMIT;

-- Kiểm tra phân bố GPA (trung bình có trọng số tín chỉ theo từng SV)
WITH per_sv AS (
  SELECT dk.sinh_vien_id,
    SUM(dk.diem_tong_ket_4 * dk.so_tin_chi) / NULLIF(SUM(dk.so_tin_chi), 0) AS gpa
  FROM dang_ky_lop_hoc dk
  JOIN lop_hoc l ON l.id = dk.lop_hoc_id AND l.ma_lop LIKE 'B21.10%'
  WHERE dk.diem_tong_ket_4 IS NOT NULL
  GROUP BY dk.sinh_vien_id
)
SELECT
  COUNT(*) FILTER (WHERE gpa >= 3.2)              AS xuat_sac_gioi,
  COUNT(*) FILTER (WHERE gpa >= 2.5 AND gpa < 3.2) AS kha,
  COUNT(*) FILTER (WHERE gpa >= 2.0 AND gpa < 2.5) AS trung_binh,
  COUNT(*) FILTER (WHERE gpa < 2.0)               AS yeu_kem,
  COUNT(*) AS tong
FROM per_sv;
