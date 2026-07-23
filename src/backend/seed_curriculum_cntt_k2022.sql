-- Seed chương trình đào tạo CNTT K2022 (7 học kỳ) theo bảng CTĐT của trường.
-- hoc_ky = học kỳ theo tiến độ (1..7). Năm học suy ra từ hoc_ky (khóa 2022) ở frontend.
BEGIN;
DELETE FROM chuong_trinh_khung WHERE nganh = 'Công nghệ thông tin';

INSERT INTO chuong_trinh_khung
  (nganh, hoc_ky, ma_mon_hoc, ten_mon_hoc, so_tin_chi, chuyen_nganh, mon_bat_buoc, tong_tiet, ly_thuyet, thuc_hanh) VALUES
-- Học kỳ 1 - Năm học 2022-2023
('Công nghệ thông tin',1,'110001','Đại số tuyến tính',2,'TT',true,45,15,30),
('Công nghệ thông tin',1,'110042','Vi tích phân A1',3,'TT',true,60,30,30),
('Công nghệ thông tin',1,'180050','Triết học Mác - Lênin',3,'TT',true,45,45,0),
('Công nghệ thông tin',1,'190081','Học phần I: Đường lối QP và an ninh của ĐCSVN',3,NULL,true,45,37,0),
('Công nghệ thông tin',1,'190082','Học phần II: Công tác quốc phòng và an ninh',2,'TT',true,30,22,0),
('Công nghệ thông tin',1,'190083','Học phần III: Quân sự chung',1,NULL,true,30,14,16),
('Công nghệ thông tin',1,'190084','Học phần IV: Kỹ thuật chiến đấu bộ binh và chiến thuật',2,NULL,true,60,4,56),
('Công nghệ thông tin',1,'191.00','Giáo dục thể chất 1 (Điền kinh)',1,'TT',true,30,0,30),
('Công nghệ thông tin',1,'220092','Nhập môn công nghệ thông tin',2,'TT',true,45,15,30),
('Công nghệ thông tin',1,'220228','Kỹ thuật lập trình',4,NULL,true,90,30,60),
('Công nghệ thông tin',1,'410291','Anh văn không chuyên 1',3,'TT',true,60,30,30),
('Công nghệ thông tin',1,'450015','Pháp luật đại cương',2,'TT',true,45,15,30),
-- Học kỳ 2 - Năm học 2022-2023
('Công nghệ thông tin',2,'110003','Toán rời rạc',2,'TT',true,45,15,30),
('Công nghệ thông tin',2,'150002','Kỹ năng mềm',2,NULL,true,45,15,30),
('Công nghệ thông tin',2,'170011','Tiếng Việt thực hành',2,'TT',true,45,15,30),
('Công nghệ thông tin',2,'180051','Kinh tế chính trị Mác - Lênin',2,'TT',true,30,30,0),
('Công nghệ thông tin',2,'192.08','Giáo dục thể chất 2 (bóng đá)',1,NULL,false,30,0,30),
('Công nghệ thông tin',2,'220233','Đại số đại cương',2,'TT',true,45,15,30),
('Công nghệ thông tin',2,'220234','Cấu trúc dữ liệu và giải thuật',4,'TT',true,90,30,60),
('Công nghệ thông tin',2,'290000','Phương pháp NC khoa học',2,'TT',true,45,15,30),
('Công nghệ thông tin',2,'410292','Anh văn không chuyên 2',4,NULL,true,90,30,60),
('Công nghệ thông tin',2,'640033','Logic học đại cương',2,'TT',true,45,15,30),
-- Học kỳ 3 (HK1 Năm học 2023-2024)
('Công nghệ thông tin',3,'110002','Vi tích phân A2',2,'TT',true,45,15,30),
('Công nghệ thông tin',3,'110079','Kiến trúc máy tính',3,NULL,true,60,30,30),
('Công nghệ thông tin',3,'180052','Chủ nghĩa xã hội khoa học',2,'TT',true,30,30,0),
('Công nghệ thông tin',3,'193.15','Giáo dục thể chất 3 (bóng chuyền)',1,NULL,false,30,0,30),
('Công nghệ thông tin',3,'220096','Cơ sở dữ liệu',3,NULL,true,60,30,30),
('Công nghệ thông tin',3,'220099','Lập trình hướng đối tượng',3,NULL,true,60,30,30),
('Công nghệ thông tin',3,'220100','Lý thuyết đồ thị',3,NULL,true,60,30,30),
('Công nghệ thông tin',3,'410293','Anh văn không chuyên 3',3,NULL,true,60,30,30),
-- Học kỳ 4 (HK2 Năm học 2023-2024)
('Công nghệ thông tin',4,'110057','Quy hoạch tuyến tính',2,'TT',false,45,16,30),
('Công nghệ thông tin',4,'120004','Vật lý đại cương',2,NULL,false,45,15,30),
('Công nghệ thông tin',4,'180001','Tư tưởng Hồ Chí Minh',2,NULL,true,30,30,0),
('Công nghệ thông tin',4,'220018','Mạng máy tính',3,'TT',true,60,30,30),
('Công nghệ thông tin',4,'220101','Hệ điều hành',3,'TT',true,60,30,30),
('Công nghệ thông tin',4,'220236','Thiết kế Web',3,NULL,false,60,30,30),
('Công nghệ thông tin',4,'220237','Lý thuyết xếp hàng',2,NULL,false,45,15,30),
('Công nghệ thông tin',4,'220250','Anh văn chuyên ngành công nghệ thông tin',3,'TT',true,60,30,30),
('Công nghệ thông tin',4,'410294','Anh văn không chuyên 4',3,NULL,true,60,30,30),
-- Học kỳ 5 (HK1 Năm học 2024-2025)
('Công nghệ thông tin',5,'180053','Lịch sử Đảng Cộng sản Việt Nam',2,NULL,true,30,30,0),
('Công nghệ thông tin',5,'220034','Chuyên đề Linux',3,'TT',false,60,30,30),
('Công nghệ thông tin',5,'220065','Thương mại điện tử',3,NULL,false,60,30,30),
('Công nghệ thông tin',5,'220086','Lập trình ứng dụng trên Windows',3,'TT',false,60,30,30),
('Công nghệ thông tin',5,'220239','Phân tích và thiết kế hệ thống thông tin',3,'TT',true,60,30,30),
('Công nghệ thông tin',5,'220241','Đồ họa ứng dụng',3,NULL,false,60,30,30),
('Công nghệ thông tin',5,'220265','Thực tập đồ án cơ sở ngành',3,'TT',true,6,0,0),
('Công nghệ thông tin',5,'220267','Điện toán đám mây',3,'TT',true,60,30,30),
('Công nghệ thông tin',5,'320045','Thống kê và phân tích dữ liệu',3,'TT',true,60,30,30),
-- Học kỳ 6 (HK2 Năm học 2024-2025)
('Công nghệ thông tin',6,'220059','Công nghệ phần mềm',3,'TT',true,60,30,30),
('Công nghệ thông tin',6,'220060','Hệ quản trị cơ sở dữ liệu',3,'TT',true,60,30,30),
('Công nghệ thông tin',6,'220071','Lập trình thiết bị di động',3,'TT',true,60,30,30),
('Công nghệ thông tin',6,'220126','An toàn và bảo mật thông tin',3,'TT',true,60,30,30),
('Công nghệ thông tin',6,'220242','Cơ sở trí tuệ nhân tạo',3,'TT',true,60,30,30),
('Công nghệ thông tin',6,'220269','Khai phá dữ liệu',3,NULL,true,60,30,30),
('Công nghệ thông tin',6,'420000','Kỹ thuật XD & ban hành văn bản',2,'TT',true,45,15,30),
('Công nghệ thông tin',6,'430000','Nguyên lý kế toán',2,NULL,false,45,15,30),
('Công nghệ thông tin',6,'440000','Quản trị doanh nghiệp',2,'TT',false,45,15,30),
('Công nghệ thông tin',6,'450006','Tâm lý học đại cương',2,'TT',false,45,15,30),
('Công nghệ thông tin',6,'460252','Chuyên đề đặc biệt',2,'TT',true,30,30,0),
-- Học kỳ 7 (HK1 Năm học 2025-2026) — phần hiển thị được trong ảnh
('Công nghệ thông tin',7,'220057','Xử lý ảnh',3,'TT',true,60,30,30),
('Công nghệ thông tin',7,'220064','Chuyên đề ASP.net',3,'TT',false,60,30,30),
('Công nghệ thông tin',7,'220078','Quản trị dự án công nghệ thông tin',3,'TT',true,60,30,30),
('Công nghệ thông tin',7,'220120','Xây dựng phần mềm hướng đối tượng',3,'TT',false,60,30,30),
('Công nghệ thông tin',7,'220243','Phát triển ứng dụng Web với Java/Spring Boot',3,'TT',false,60,30,30);

COMMIT;
SELECT hoc_ky, COUNT(*) mon, SUM(so_tin_chi) tc FROM chuong_trinh_khung GROUP BY hoc_ky ORDER BY hoc_ky;
