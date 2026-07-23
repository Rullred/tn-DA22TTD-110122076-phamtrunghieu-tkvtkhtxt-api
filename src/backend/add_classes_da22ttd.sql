-- Tạo 5 lớp học phần HK1 2022-2023 cho lớp hành chính DA22TTD + ghi danh toàn bộ SV DA22TTD.
-- GV bốc ngẫu nhiên (5 GV khác nhau), lịch học không trùng ngày, phòng B21.101..B21.105.
BEGIN;

-- 5 lớp, mỗi lớp gán 1 GV ngẫu nhiên khác nhau
WITH tchers AS (
  SELECT id, row_number() OVER (ORDER BY random()) rn
  FROM giang_vien WHERE trang_thai = 'HOAT_DONG' LIMIT 5
),
subs(rn, ma_lop, ten_lop, mon_hoc, phong, lich, tin_chi) AS (VALUES
  (1,'B21.101','Đại số tuyến tính - DA22TTD','Đại số tuyến tính','B21.101','Thứ 2 (tiết 1-3)',2),
  (2,'B21.102','Nhập môn công nghệ thông tin - DA22TTD','Nhập môn công nghệ thông tin','B21.102','Thứ 3 (tiết 1-3)',2),
  (3,'B21.103','Kỹ thuật lập trình - DA22TTD','Kỹ thuật lập trình','B21.103','Thứ 4 (tiết 1-4)',4),
  (4,'B21.104','Anh văn không chuyên 1 - DA22TTD','Anh văn không chuyên 1','B21.104','Thứ 5 (tiết 1-3)',3),
  (5,'B21.105','Pháp luật đại cương - DA22TTD','Pháp luật đại cương','B21.105','Thứ 6 (tiết 1-3)',2)
)
INSERT INTO lop_hoc
  (ma_lop, ten_lop, giang_vien_id, nam_hoc, hoc_ky, mon_hoc, phong_hoc, lich_hoc,
   so_sinh_vien_toi_da, so_sinh_vien_hien_tai, ngay_bat_dau, ngay_ket_thuc, mo_ta, trang_thai, loai_lop, ngay_tao)
SELECT s.ma_lop, s.ten_lop, t.id, '2022-2023', 1, s.mon_hoc, s.phong, s.lich,
       50, (SELECT COUNT(*) FROM sinh_vien WHERE lop_hanh_chinh = 'DA22TTD'),
       DATE '2022-09-05', DATE '2023-01-15', 'Lớp bắt buộc của DA22TTD - HK1 2022-2023',
       'HOAT_DONG', 'LOP_HOC_PHAN', NOW()
FROM subs s JOIN tchers t ON t.rn = s.rn
ON CONFLICT (ma_lop) DO NOTHING;

-- Ghi danh toàn bộ SV DA22TTD vào cả 5 lớp (so_tin_chi theo môn)
INSERT INTO dang_ky_lop_hoc (lop_hoc_id, sinh_vien_id, ngay_dang_ky, trang_thai, so_tin_chi)
SELECT l.id, sv.id, NOW(), 'DA_DANG_KY',
       CASE l.ma_lop WHEN 'B21.103' THEN 4 WHEN 'B21.104' THEN 3 ELSE 2 END
FROM lop_hoc l
CROSS JOIN sinh_vien sv
WHERE l.ma_lop IN ('B21.101','B21.102','B21.103','B21.104','B21.105')
  AND sv.lop_hanh_chinh = 'DA22TTD'
ON CONFLICT (lop_hoc_id, sinh_vien_id) DO NOTHING;

COMMIT;

SELECT l.ma_lop, l.mon_hoc, gv.ho_ten AS giang_vien, l.lich_hoc,
       (SELECT COUNT(*) FROM dang_ky_lop_hoc dk WHERE dk.lop_hoc_id = l.id) AS si_so
FROM lop_hoc l LEFT JOIN giang_vien gv ON gv.id = l.giang_vien_id
WHERE l.ma_lop LIKE 'B21.10%' ORDER BY l.ma_lop;
