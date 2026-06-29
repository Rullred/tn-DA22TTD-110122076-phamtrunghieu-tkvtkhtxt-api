-- ============================================
-- Migration V2: Create Subjects (Môn học) Table
-- ============================================

-- Subjects/Courses table (Môn học)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_code VARCHAR(20) NOT NULL UNIQUE, -- Mã môn học (110001, 118051...)
    subject_name VARCHAR(200) NOT NULL, -- Tên môn học (Đại số tuyến tính...)
    credits INTEGER NOT NULL DEFAULT 3, -- Số tín chỉ
    theory_hours INTEGER DEFAULT 30, -- Số tiết lý thuyết
    practice_hours INTEGER DEFAULT 15, -- Số tiết thực hành
    lab_hours INTEGER DEFAULT 0, -- Số tiết thí nghiệm
    department VARCHAR(100), -- Khoa phụ trách
    prerequisite_subjects TEXT, -- Môn học tiên quyết (JSON array of subject_code)
    description TEXT, -- Mô tả môn học
    learning_outcomes TEXT, -- Chuẩn đầu ra môn học
    semester_recommended INTEGER DEFAULT 1, -- Học kỳ khuyến nghị học
    is_required BOOLEAN DEFAULT true, -- Môn bắt buộc hay tự chọn
    major VARCHAR(100), -- Ngành (CNTT, TTNT, KTMT...)
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create index for faster lookups
CREATE INDEX idx_subjects_code ON subjects(subject_code);
CREATE INDEX idx_subjects_major ON subjects(major);
CREATE INDEX idx_subjects_status ON subjects(status);

-- Add subject_id foreign key to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject_id UUID;
ALTER TABLE classes ADD CONSTRAINT fk_class_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL;

-- Add class_type to differentiate administrative class vs course class
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_type VARCHAR(30) DEFAULT 'COURSE_CLASS' CHECK (class_type IN ('ADMINISTRATIVE_CLASS', 'COURSE_CLASS'));

-- Comment on columns
COMMENT ON COLUMN classes.class_type IS 'ADMINISTRATIVE_CLASS: Lớp hành chính (DA22TTD), COURSE_CLASS: Lớp học phần (môn học)';
COMMENT ON TABLE subjects IS 'Danh mục môn học (Subjects/Courses)';
