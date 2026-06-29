-- ============================================
-- SEED DATA: DANH MỤC MÔN HỌC (SUBJECTS)
-- Dữ liệu từ hệ thống TVU CET
-- ============================================

TRUNCATE TABLE subjects CASCADE;

-- Học kỳ 1 - Năm học 2022-2023
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('110001', 'Đại số tuyến tính', 3, 45, 15, 'Toán học', 1, true, 'CNTT', 'ACTIVE'),
('110642', 'Vi tích phân A1', 3, 45, 15, 'Toán học', 1, true, 'CNTT', 'ACTIVE'),
('180050', 'Triết học Mác - Lênin', 3, 45, 15, 'Khoa học xã hội và nhân văn', 1, true, 'CNTT', 'ACTIVE'),
('190001', 'Học phần 1: Đường lối cải cách của BCSXCN', 2, 30, 0, 'Chính trị', 1, true, 'CNTT', 'ACTIVE'),
('190062', 'Học phần II: Công tác quốc phòng và an ninh', 2, 30, 0, 'Quân sự', 1, true, 'CNTT', 'ACTIVE'),
('190063', 'Học phần III: Quân sự chung', 1, 15, 15, 'Quân sự', 1, true, 'CNTT', 'ACTIVE'),
('190064', 'Học phần IV: Kỹ thuật chiến đấu bộ binh và chiến thuật', 2, 30, 15, 'Quân sự', 1, true, 'CNTT', 'ACTIVE'),
('171150', 'Giáo dục thể chất 1 (Điền kinh)', 1, 15, 15, 'Giáo dục thể chất', 1, true, 'CNTT', 'ACTIVE'),
('22008

2', 'Nhập môn công nghệ thông tin', 2, 30, 0, 'Công nghệ thông tin', 1, true, 'CNTT', 'ACTIVE'),
('220225', 'Kỹ thuật lập trình', 4, 45, 30, 'Công nghệ thông tin', 1, true, 'CNTT', 'ACTIVE');

-- Học kỳ 2 - Năm học 2022-2023
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('110052', 'Thống kê học', 2, 30, 0, 'Toán học', 2, true, 'CNTT', 'ACTIVE'),
('145002', 'Kỹ năng mềm', 2, 30, 0, 'Kỹ năng mềm', 2, true, 'CNTT', 'ACTIVE'),
('172011', 'Tiếng Việt thực hành', 2, 30, 0, 'Ngữ văn', 2, true, 'CNTT', 'ACTIVE'),
('180051', 'Kinh tế chính trị Mác - Lênin', 2, 30, 0, 'Kinh tế', 2, true, 'CNTT', 'ACTIVE'),
('192158', 'Giáo dục thể chất 2 (Bóng đá)', 1, 15, 15, 'Giáo dục thể chất', 2, true, 'CNTT', 'ACTIVE'),
('220333', 'Đại số đại cương', 2, 30, 0, 'Toán học', 2, true, 'CNTT', 'ACTIVE'),
('220234', 'Cấu trúc dữ liệu và giải thuật', 3, 45, 15, 'Công nghệ thông tin', 2, true, 'CNTT', 'ACTIVE'),
('220265', 'Lập trình hướng đối tượng', 3, 45, 15, 'Công nghệ thông tin', 2, true, 'CNTT', 'ACTIVE'),
('220270', 'Lý thuyết đồ thị', 2, 30, 0, 'Toán học ứng dụng', 2, true, 'CNTT', 'ACTIVE'),
('410292', 'Anh văn không chuyên 1', 3, 45, 0, 'Ngoại ngữ', 2, true, 'CNTT', 'ACTIVE');

-- Học kỳ 3 - Năm học 2022-2023  
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('420015', 'Hệ quản trị cơ sở dữ liệu', 2, 30, 15, 'Công nghệ thông tin', 3, true, 'CNTT', 'ACTIVE'),
('648023', 'Logic học đại cương', 2, 30, 0, 'Triết học', 3, true, 'CNTT', 'ACTIVE');

-- Học kỳ 1 - Năm học 2023-2024
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('110052', 'Giải tích hàm phức và phép biến đổi Laplace', 2, 30, 0, 'Toán học', 3, true, 'CNTT', 'ACTIVE'),
('120024', 'Vật lý đại cương', 2, 30, 0, 'Vật lý', 3, true, 'CNTT', 'ACTIVE'),
('180103', 'Tư tưởng Hồ Chí Minh', 2, 30, 0, 'Chính trị', 3, true, 'CNTT', 'ACTIVE'),
('220118', 'Mạng máy tính', 3, 45, 15, 'Công nghệ thông tin', 3, true, 'CNTT', 'ACTIVE'),
('220191', 'Hệ điều hành', 3, 45, 15, 'Công nghệ thông tin', 3, true, 'CNTT', 'ACTIVE'),
('220236', 'Thuật toán Web', 3, 45, 15, 'Công nghệ thông tin', 3, true, 'CNTT', 'ACTIVE'),
('220237', 'Lý thuyết độ thị', 2, 30, 0, 'Toán học ứng dụng', 3, true, 'CNTT', 'ACTIVE'),
('330338', 'Anh văn chuyên ngành Công nghệ thông tin', 3, 45, 0, 'Ngoại ngữ', 3, true, 'CNTT', 'ACTIVE'),
('410292', 'Anh văn không chuyên 2', 3, 45, 0, 'Ngoại ngữ', 3, false, 'CNTT', 'ACTIVE');

-- Học kỳ 2 - Năm học 2023-2024
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('110057', 'Quy hoạch tuyến tính', 2, 30, 0, 'Toán học', 4, true, 'CNTT', 'ACTIVE'),
('120004', 'Vật lý đại cương', 2, 30, 0, 'Vật lý', 4, true, 'CNTT', 'ACTIVE'),
('180103', 'Tư tưởng Hồ Chí Minh', 2, 30, 0, 'Chính trị', 4, true, 'CNTT', 'ACTIVE'),
('220116', 'Kỹ thuật vi xử lý và hệ thống nhúng', 3, 45, 15, 'Công nghệ thông tin', 4, true, 'CNTT', 'ACTIVE'),
('220642', 'Cơ sở dữ liệu phân tán', 3, 45, 15, 'Công nghệ thông tin', 4, true, 'CNTT', 'ACTIVE'),
('220366', 'Khai phác dữ liệu', 3, 45, 15, 'Công nghệ thông tin', 4, true, 'CNTT', 'ACTIVE'),
('420090', 'Kỹ thuật XD & lập trình web nâng cao', 2, 30, 15, 'Công nghệ thông tin', 4, true, 'CNTT', 'ACTIVE'),
('430000', 'Nguyên lý kế toán', 2, 30, 0, 'Kinh tế', 4, false, 'CNTT', 'ACTIVE'),
('440360', 'Quản trị doanh nghiệp', 2, 30, 0, 'Quản trị kinh doanh', 4, false, 'CNTT', 'ACTIVE'),
('450030', 'Tiêm lý học đại cương', 2, 30, 0, 'Tâm lý học', 4, false, 'CNTT', 'ACTIVE'),
('660252', 'Chuyên đề các bệt', 2, 30, 0, 'Y học', 4, false, 'CNTT', 'ACTIVE');

-- Học kỳ 1 - Năm học 2024-2025
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('180053', 'Lịch sử Đảng Cộng sản Việt Nam', 2, 30, 0, 'Chính trị', 5, true, 'CNTT', 'ACTIVE'),
('220044', 'Chuyên đề Android', 3, 45, 15, 'Công nghệ thông tin', 5, true, 'CNTT', 'ACTIVE'),
('220059', 'Thương mại điện tử', 3, 45, 15, 'Công nghệ thông tin', 5, true, 'CNTT', 'ACTIVE'),
('220145', 'Thống kế và phân tích dữ liệu', 3, 45, 15, 'Công nghệ thông tin', 5, true, 'CNTT', 'ACTIVE'),
('220646', 'Lập trình ứng dụng trong Windows', 3, 45, 15, 'Công nghệ thông tin', 5, false, 'CNTT', 'ACTIVE'),
('220269', 'Xử lý ảnh và video', 3, 45, 15, 'Công nghệ thông tin', 5, false, 'CNTT', 'ACTIVE'),
('220268', 'Máy học ứng dụng', 3, 45, 15, 'Công nghệ thông tin', 5, false, 'CNTT', 'ACTIVE'),
('220289', 'Thuật toán đồ họa máy tính', 3, 45, 15, 'Công nghệ thông tin', 5, false, 'CNTT', 'ACTIVE'),
('220385', 'Phát triển ứng dụng dựa trên IoT', 3, 45, 15, 'Công nghệ thông tin', 5, false, 'CNTT', 'ACTIVE');

-- Học kỳ 2 - Năm học 2024-2025
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('220333', 'Công nghệ phần mềm', 3, 45, 15, 'Công nghệ thông tin', 6, true, 'CNTT', 'ACTIVE'),
('220400', 'Hệ quản trị cơ sở dữ liệu', 2, 30, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220071', 'Lập trình thiết bị di động', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220124', 'Xử lý ngôn ngữ tự nhiên', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220342', 'Cơ sở dữ liệu phân tán', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220365', 'Khai phác dữ liệu', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220646', 'Lập trình ứng dụng trong Windows', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220126', 'Xây dựng phần mềm hướng dịch vụ', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220343', 'Phát triển ứng dụng dựng trên nguồn mở', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220245', 'Trường học người máy một nhỏ', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220266', 'Phát triển và triển khai hệ thống thông tin', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE'),
('220627', 'Điện toán đám mây', 3, 45, 15, 'Công nghệ thông tin', 6, false, 'CNTT', 'ACTIVE');

-- Học kỳ 1 - Năm học 2025-2026
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('290583', 'Xử lý ảnh', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('220064', 'Chuyên đề Android', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('220076', 'Lập trình thiết bị di động', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('220228', 'Quản trị dữ liệu công nghệ thông tin', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('220120', 'Xây dựng phần mềm hướng đối tượng', 2, 30, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('290542', 'Phát triển ứng dụng dựng trên nguồn mở', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('220245', 'Trường học người máy một nhỏ', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE'),
('220266', 'Phát triển và triển khai hệ thống thông tin', 3, 45, 15, 'Công nghệ thông tin', 7, false, 'CNTT', 'ACTIVE');

-- Học kỳ 2 - Năm học 2025-2026
INSERT INTO subjects (subject_code, subject_name, credits, theory_hours, practice_hours, department, semester_recommended, is_required, major, status) VALUES
('000002', 'Đồ án tốt nghiệp', 7, 0, 0, 'Công nghệ thông tin', 8, true, 'CNTT', 'ACTIVE'),
('162008', 'Pháp học cơ bản', 3, 45, 0, 'Luật', 8, false, 'CNTT', 'ACTIVE'),
('230227', 'Nhập môn', 3, 45, 0, 'Công nghệ thông tin', 8, false, 'CNTT', 'ACTIVE'),
('220022', 'Hệ thống thông tin quản lý', 3, 45, 15, 'Công nghệ thông tin', 8, false, 'CNTT', 'ACTIVE');

-- Lưu ý: Dữ liệu trên được trích xuất từ hệ thống quản lý đào tạo TVU CET
-- Một số môn học có thể chưa đầy đủ thông tin chi tiết (credits, hours...)
-- Cần bổ sung thêm từ chương trình đào tạo chính thức
