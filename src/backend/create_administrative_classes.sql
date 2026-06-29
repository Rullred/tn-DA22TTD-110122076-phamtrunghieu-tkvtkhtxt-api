-- ============================================
-- TẠO LỚP HÀNH CHÍNH (ADMINISTRATIVE CLASSES)
-- Lớp khóa học cố định: DA22TTD, DA23CNTT...
-- ============================================

-- Bước 1: Thêm cột class_type nếu chưa có (từ migration V2)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_type VARCHAR(30) DEFAULT 'COURSE_CLASS' 
CHECK (class_type IN ('ADMINISTRATIVE_CLASS', 'COURSE_CLASS'));

-- Bước 2: Xóa dữ liệu lớp hành chính cũ (nếu có) để tạo lại
DELETE FROM classes WHERE class_type = 'ADMINISTRATIVE_CLASS';

-- Bước 3: Tạo lớp hành chính cho các khóa

-- Khóa 2022 (K22)
INSERT INTO classes (
  id, class_code, class_name, class_type, status, academic_year, semester, 
  max_students, current_students, description, created_at
) VALUES
  (
    uuid_generate_v4(), 
    'DA22TTD', 
    'Lớp K22 Công nghệ thông tin D', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2022-2026', 
    1, 
    45, 
    0, 
    'Lớp hành chính khóa 2022 - Ngành Công nghệ thông tin', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA22TTA', 
    'Lớp K22 Công nghệ thông tin A', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2022-2026', 
    1, 
    40, 
    0, 
    'Lớp hành chính khóa 2022 - Ngành Công nghệ thông tin', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA22TTB', 
    'Lớp K22 Công nghệ thông tin B', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2022-2026', 
    1, 
    40, 
    0, 
    'Lớp hành chính khóa 2022 - Ngành Công nghệ thông tin', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA22TTC', 
    'Lớp K22 Công nghệ thông tin C', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2022-2026', 
    1, 
    40, 
    0, 
    'Lớp hành chính khóa 2022 - Ngành Công nghệ thông tin', 
    NOW()
  );

-- Khóa 2023 (K23)
INSERT INTO classes (
  id, class_code, class_name, class_type, status, academic_year, semester, 
  max_students, current_students, description, created_at
) VALUES
  (
    uuid_generate_v4(), 
    'DA23CNTT', 
    'Lớp K23 Công nghệ thông tin', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2023-2027', 
    1, 
    50, 
    0, 
    'Lớp hành chính khóa 2023 - Ngành Công nghệ thông tin', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA23TTNT', 
    'Lớp K23 Trí tuệ nhân tạo', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2023-2027', 
    1, 
    30, 
    0, 
    'Lớp hành chính khóa 2023 - Ngành Trí tuệ nhân tạo', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA23KTMT', 
    'Lớp K23 Kỹ thuật máy tính', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2023-2027', 
    1, 
    35, 
    0, 
    'Lớp hành chính khóa 2023 - Ngành Kỹ thuật máy tính', 
    NOW()
  );

-- Khóa 2024 (K24)
INSERT INTO classes (
  id, class_code, class_name, class_type, status, academic_year, semester, 
  max_students, current_students, description, created_at
) VALUES
  (
    uuid_generate_v4(), 
    'DA24AI', 
    'Lớp K24 Artificial Intelligence', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2024-2028', 
    1, 
    35, 
    0, 
    'Lớp hành chính khóa 2024 - Ngành AI', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA24CNTT', 
    'Lớp K24 Công nghệ thông tin', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2024-2028', 
    1, 
    45, 
    0, 
    'Lớp hành chính khóa 2024 - Ngành Công nghệ thông tin', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA24DS', 
    'Lớp K24 Data Science', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2024-2028', 
    1, 
    30, 
    0, 
    'Lớp hành chính khóa 2024 - Ngành Data Science', 
    NOW()
  );

-- Khóa 2025 (K25)
INSERT INTO classes (
  id, class_code, class_name, class_type, status, academic_year, semester, 
  max_students, current_students, description, created_at
) VALUES
  (
    uuid_generate_v4(), 
    'DA25CNTT', 
    'Lớp K25 Công nghệ thông tin', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2025-2029', 
    1, 
    40, 
    0, 
    'Lớp hành chính khóa 2025 - Ngành Công nghệ thông tin', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA25AI', 
    'Lớp K25 Trí tuệ nhân tạo', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2025-2029', 
    1, 
    35, 
    0, 
    'Lớp hành chính khóa 2025 - Ngành AI', 
    NOW()
  ),
  (
    uuid_generate_v4(), 
    'DA25CYBER', 
    'Lớp K25 An toàn thông tin', 
    'ADMINISTRATIVE_CLASS', 
    'ACTIVE', 
    '2025-2029', 
    1, 
    30, 
    0, 
    'Lớp hành chính khóa 2025 - Ngành An toàn thông tin', 
    NOW()
  );

-- Bước 4: Cập nhật các lớp cũ thành COURSE_CLASS (nếu chúng là lớp học phần)
UPDATE classes 
SET class_type = 'COURSE_CLASS' 
WHERE class_type IS NULL OR class_type = 'COURSE_CLASS';

-- Bước 5: Kiểm tra kết quả
SELECT 
  class_code, 
  class_name, 
  class_type, 
  academic_year, 
  max_students,
  status
FROM classes 
WHERE class_type = 'ADMINISTRATIVE_CLASS'
ORDER BY academic_year, class_code;

-- Thống kê
SELECT 
  class_type,
  COUNT(*) as total_classes
FROM classes
GROUP BY class_type;

-- Comment
COMMENT ON COLUMN classes.class_type IS 'ADMINISTRATIVE_CLASS: Lớp hành chính (DA22TTD...), COURSE_CLASS: Lớp học phần (môn học)';

-- ============================================
-- KẾT QUẢ MONG ĐỢI:
-- ============================================
-- Có 14 lớp hành chính:
--   - Khóa 2022: 4 lớp (DA22TTA, DA22TTB, DA22TTC, DA22TTD)
--   - Khóa 2023: 3 lớp (DA23CNTT, DA23TTNT, DA23KTMT)
--   - Khóa 2024: 3 lớp (DA24AI, DA24CNTT, DA24DS)
--   - Khóa 2025: 3 lớp (DA25CNTT, DA25AI, DA25CYBER)
-- ============================================
