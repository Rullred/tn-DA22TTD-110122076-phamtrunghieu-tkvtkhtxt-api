-- ============================================
-- MIGRATION V2: Chuyển đổi toàn bộ tên bảng và cột sang tiếng Việt
-- (Combined for IAM and HR services)
-- ============================================

-- ============================================
-- RENAME TABLES (IAM SERVICE)
-- ============================================

-- Rename users table
ALTER TABLE users RENAME TO nguoi_dung;

-- Rename user_roles table
ALTER TABLE user_roles RENAME TO vai_tro_nguoi_dung;

-- Rename refresh_tokens table
ALTER TABLE refresh_tokens RENAME TO token_lam_moi;

-- Rename security_logs table
ALTER TABLE security_logs RENAME TO nhat_ky_bao_mat;

-- Rename ip_blacklist table
ALTER TABLE ip_blacklist RENAME TO danh_sach_ip_chan;

-- Rename ip_login_attempts table
ALTER TABLE ip_login_attempts RENAME TO thu_dang_nhap_ip;

-- ============================================
-- RENAME COLUMNS - nguoi_dung (users)
-- ============================================

ALTER TABLE nguoi_dung RENAME COLUMN username TO ten_dang_nhap;
-- email giữ nguyên tên
ALTER TABLE nguoi_dung RENAME COLUMN password_hash TO mat_khau_ma_hoa;
ALTER TABLE nguoi_dung RENAME COLUMN role TO vai_tro;
ALTER TABLE nguoi_dung RENAME COLUMN is_locked TO bi_khoa;
ALTER TABLE nguoi_dung RENAME COLUMN locked_until TO khoa_den;
ALTER TABLE nguoi_dung RENAME COLUMN enabled TO kich_hoat;
ALTER TABLE nguoi_dung RENAME COLUMN failed_login_attempts TO so_lan_dang_nhap_that_bai;
ALTER TABLE nguoi_dung RENAME COLUMN last_login_at TO lan_dang_nhap_cuoi;
ALTER TABLE nguoi_dung RENAME COLUMN last_login_ip TO ip_dang_nhap_cuoi;
ALTER TABLE nguoi_dung RENAME COLUMN created_at TO ngay_tao;
ALTER TABLE nguoi_dung RENAME COLUMN updated_at TO ngay_cap_nhat;
ALTER TABLE nguoi_dung RENAME COLUMN created_by TO nguoi_tao;
ALTER TABLE nguoi_dung RENAME COLUMN updated_by TO nguoi_cap_nhat;

-- ============================================
-- RENAME COLUMNS - vai_tro_nguoi_dung (user_roles)
-- ============================================

ALTER TABLE vai_tro_nguoi_dung RENAME COLUMN user_id TO nguoi_dung_id;
ALTER TABLE vai_tro_nguoi_dung RENAME COLUMN role TO vai_tro;

-- ============================================
-- RENAME COLUMNS - token_lam_moi (refresh_tokens)
-- ============================================

ALTER TABLE token_lam_moi RENAME COLUMN user_id TO nguoi_dung_id;
ALTER TABLE token_lam_moi RENAME COLUMN token_hash TO token_ma_hoa;
ALTER TABLE token_lam_moi RENAME COLUMN expires_at TO het_han_luc;
ALTER TABLE token_lam_moi RENAME COLUMN is_revoked TO bi_thu_hoi;
ALTER TABLE token_lam_moi RENAME COLUMN created_at TO ngay_tao;
ALTER TABLE token_lam_moi RENAME COLUMN revoked_at TO ngay_thu_hoi;

-- ============================================
-- RENAME COLUMNS - nhat_ky_bao_mat (security_logs)
-- ============================================

ALTER TABLE nhat_ky_bao_mat RENAME COLUMN user_id TO nguoi_dung_id;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN username TO ten_dang_nhap;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN action TO hanh_dong;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN result TO ket_qua;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN ip_address TO dia_chi_ip;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN user_agent TO trinh_duyet;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN message TO thong_bao;
ALTER TABLE nhat_ky_bao_mat RENAME COLUMN created_at TO ngay_tao;

-- ============================================
-- RENAME COLUMNS - danh_sach_ip_chan (ip_blacklist)
-- ============================================

ALTER TABLE danh_sach_ip_chan RENAME COLUMN ip_address TO dia_chi_ip;
ALTER TABLE danh_sach_ip_chan RENAME COLUMN blocked_at TO ngay_chan;
ALTER TABLE danh_sach_ip_chan RENAME COLUMN reason TO ly_do;

-- ============================================
-- RENAME COLUMNS - thu_dang_nhap_ip (ip_login_attempts)
-- ============================================

ALTER TABLE thu_dang_nhap_ip RENAME COLUMN ip_address TO dia_chi_ip;
ALTER TABLE thu_dang_nhap_ip RENAME COLUMN failed_attempts TO so_lan_that_bai;
ALTER TABLE thu_dang_nhap_ip RENAME COLUMN last_failed_at TO lan_that_bai_cuoi;


-- ============================================
-- RENAME TABLES (HR SERVICE)
-- ============================================

-- Rename students table
ALTER TABLE students RENAME TO sinh_vien;

-- Rename teachers table
ALTER TABLE teachers RENAME TO giang_vien;

-- Rename classes table
ALTER TABLE classes RENAME TO lop_hoc;

-- Rename class_enrollments table
ALTER TABLE class_enrollments RENAME TO dang_ky_lop_hoc;

-- ============================================
-- RENAME COLUMNS - sinh_vien (students)
-- ============================================

ALTER TABLE sinh_vien RENAME COLUMN user_id TO nguoi_dung_id;
ALTER TABLE sinh_vien RENAME COLUMN student_code TO ma_sinh_vien;
ALTER TABLE sinh_vien RENAME COLUMN first_name TO ten;
ALTER TABLE sinh_vien RENAME COLUMN last_name TO ho;
ALTER TABLE sinh_vien RENAME COLUMN full_name TO ho_ten;
-- email giữ nguyên tên
ALTER TABLE sinh_vien RENAME COLUMN gender TO gioi_tinh;
ALTER TABLE sinh_vien RENAME COLUMN date_of_birth TO ngay_sinh;
ALTER TABLE sinh_vien RENAME COLUMN phone_number TO so_dien_thoai;
ALTER TABLE sinh_vien RENAME COLUMN address TO dia_chi;
ALTER TABLE sinh_vien RENAME COLUMN avatar_url TO anh_dai_dien;
ALTER TABLE sinh_vien RENAME COLUMN enrollment_date TO ngay_nhap_hoc;
ALTER TABLE sinh_vien RENAME COLUMN major TO chuyen_nganh;
ALTER TABLE sinh_vien RENAME COLUMN academic_year TO nam_hoc;
ALTER TABLE sinh_vien RENAME COLUMN status TO trang_thai;
ALTER TABLE sinh_vien RENAME COLUMN created_at TO ngay_tao;
ALTER TABLE sinh_vien RENAME COLUMN updated_at TO ngay_cap_nhat;
ALTER TABLE sinh_vien RENAME COLUMN created_by TO nguoi_tao;
ALTER TABLE sinh_vien RENAME COLUMN updated_by TO nguoi_cap_nhat;

-- ============================================
-- RENAME COLUMNS - giang_vien (teachers)
-- ============================================

ALTER TABLE giang_vien RENAME COLUMN user_id TO nguoi_dung_id;
ALTER TABLE giang_vien RENAME COLUMN teacher_code TO ma_giang_vien;
ALTER TABLE giang_vien RENAME COLUMN first_name TO ten;
ALTER TABLE giang_vien RENAME COLUMN last_name TO ho;
ALTER TABLE giang_vien RENAME COLUMN full_name TO ho_ten;
-- email giữ nguyên tên
ALTER TABLE giang_vien RENAME COLUMN gender TO gioi_tinh;
ALTER TABLE giang_vien RENAME COLUMN date_of_birth TO ngay_sinh;
ALTER TABLE giang_vien RENAME COLUMN phone_number TO so_dien_thoai;
ALTER TABLE giang_vien RENAME COLUMN department TO khoa;
ALTER TABLE giang_vien RENAME COLUMN avatar_url TO anh_dai_dien;
ALTER TABLE giang_vien RENAME COLUMN specialization TO chuyen_mon;
ALTER TABLE giang_vien RENAME COLUMN address TO dia_chi;
ALTER TABLE giang_vien RENAME COLUMN hire_date TO ngay_tuyen_dung;
ALTER TABLE giang_vien RENAME COLUMN office_location TO phong_lam_viec;
ALTER TABLE giang_vien RENAME COLUMN status TO trang_thai;
ALTER TABLE giang_vien RENAME COLUMN created_at TO ngay_tao;
ALTER TABLE giang_vien RENAME COLUMN updated_at TO ngay_cap_nhat;
ALTER TABLE giang_vien RENAME COLUMN created_by TO nguoi_tao;
ALTER TABLE giang_vien RENAME COLUMN updated_by TO nguoi_cap_nhat;

-- ============================================
-- RENAME COLUMNS - lop_hoc (classes)
-- ============================================

ALTER TABLE lop_hoc RENAME COLUMN class_code TO ma_lop;
ALTER TABLE lop_hoc RENAME COLUMN class_name TO ten_lop;
ALTER TABLE lop_hoc RENAME COLUMN teacher_id TO giang_vien_id;
ALTER TABLE lop_hoc RENAME COLUMN academic_year TO nam_hoc;
ALTER TABLE lop_hoc RENAME COLUMN semester TO hoc_ky;
ALTER TABLE lop_hoc RENAME COLUMN subject TO mon_hoc;
ALTER TABLE lop_hoc RENAME COLUMN room TO phong_hoc;
ALTER TABLE lop_hoc RENAME COLUMN schedule TO lich_hoc;
ALTER TABLE lop_hoc RENAME COLUMN max_students TO so_sinh_vien_toi_da;
ALTER TABLE lop_hoc RENAME COLUMN current_students TO so_sinh_vien_hien_tai;
ALTER TABLE lop_hoc RENAME COLUMN start_date TO ngay_bat_dau;
ALTER TABLE lop_hoc RENAME COLUMN end_date TO ngay_ket_thuc;
ALTER TABLE lop_hoc RENAME COLUMN description TO mo_ta;
ALTER TABLE lop_hoc RENAME COLUMN status TO trang_thai;
ALTER TABLE lop_hoc RENAME COLUMN created_at TO ngay_tao;
ALTER TABLE lop_hoc RENAME COLUMN updated_at TO ngay_cap_nhat;
ALTER TABLE lop_hoc RENAME COLUMN created_by TO nguoi_tao;
ALTER TABLE lop_hoc RENAME COLUMN updated_by TO nguoi_cap_nhat;

-- ============================================
-- RENAME COLUMNS - dang_ky_lop_hoc (class_enrollments)
-- ============================================

ALTER TABLE dang_ky_lop_hoc RENAME COLUMN class_id TO lop_hoc_id;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN student_id TO sinh_vien_id;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN enrollment_date TO ngay_dang_ky;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN status TO trang_thai;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN grade TO diem;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN attendance_rate TO ty_le_diem_danh;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN notes TO ghi_chu;
ALTER TABLE dang_ky_lop_hoc RENAME COLUMN dropped_at TO ngay_bo_hoc;

-- ============================================
-- UPDATE UNIQUE CONSTRAINTS
-- ============================================

-- Drop old unique constraint
ALTER TABLE dang_ky_lop_hoc DROP CONSTRAINT IF EXISTS uk_class_student;

-- Recreate with new column names
ALTER TABLE dang_ky_lop_hoc 
    ADD CONSTRAINT uk_lop_hoc_sinh_vien UNIQUE (lop_hoc_id, sinh_vien_id);

-- ============================================
-- UPDATE CHECK CONSTRAINTS
-- ============================================

-- Drop old check constraints
ALTER TABLE sinh_vien DROP CONSTRAINT IF EXISTS students_gender_check;
ALTER TABLE sinh_vien DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE giang_vien DROP CONSTRAINT IF EXISTS teachers_gender_check;
ALTER TABLE giang_vien DROP CONSTRAINT IF EXISTS teachers_status_check;
ALTER TABLE lop_hoc DROP CONSTRAINT IF EXISTS classes_status_check;
ALTER TABLE dang_ky_lop_hoc DROP CONSTRAINT IF EXISTS chk_enrollment_status;
ALTER TABLE dang_ky_lop_hoc DROP CONSTRAINT IF EXISTS chk_attendance_rate;

-- Recreate with new column names and Vietnamese enum values
ALTER TABLE sinh_vien 
    ADD CONSTRAINT sinh_vien_gioi_tinh_check 
    CHECK (gioi_tinh IN ('NAM', 'NU', 'KHAC'));

ALTER TABLE sinh_vien 
    ADD CONSTRAINT sinh_vien_trang_thai_check 
    CHECK (trang_thai IN ('HOAT_DONG', 'KHONG_HOAT_DONG', 'DA_TOT_NGHIEP', 'BI_DINH_CHI'));

ALTER TABLE giang_vien 
    ADD CONSTRAINT giang_vien_gioi_tinh_check 
    CHECK (gioi_tinh IN ('NAM', 'NU', 'KHAC'));

ALTER TABLE giang_vien 
    ADD CONSTRAINT giang_vien_trang_thai_check 
    CHECK (trang_thai IN ('HOAT_DONG', 'KHONG_HOAT_DONG', 'NGHI_PHEP', 'DA_NGHI_HUU'));

ALTER TABLE lop_hoc 
    ADD CONSTRAINT lop_hoc_trang_thai_check 
    CHECK (trang_thai IN ('HOAT_DONG', 'KHONG_HOAT_DONG', 'DA_HOAN_THANH', 'DA_HUY'));

ALTER TABLE dang_ky_lop_hoc 
    ADD CONSTRAINT dang_ky_lop_hoc_trang_thai_check 
    CHECK (trang_thai IN ('DA_DANG_KY', 'DA_HOAN_THANH', 'DA_BO_HOC', 'THAT_BAI'));

ALTER TABLE dang_ky_lop_hoc 
    ADD CONSTRAINT dang_ky_lop_hoc_ty_le_diem_danh_check 
    CHECK (ty_le_diem_danh IS NULL OR (ty_le_diem_danh >= 0 AND ty_le_diem_danh <= 100));

-- ============================================
-- UPDATE INDEXES
-- ============================================

-- Drop old indexes (IAM)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token_hash;
DROP INDEX IF EXISTS idx_security_logs_user_id;
DROP INDEX IF EXISTS idx_security_logs_created_at;

-- Drop old indexes (HR)
DROP INDEX IF EXISTS idx_students_user_id;
DROP INDEX IF EXISTS idx_students_student_code;
DROP INDEX IF EXISTS idx_students_status;
DROP INDEX IF EXISTS idx_students_major;
DROP INDEX IF EXISTS idx_students_academic_year;
DROP INDEX IF EXISTS idx_students_full_name;
DROP INDEX IF EXISTS idx_teachers_user_id;
DROP INDEX IF EXISTS idx_teachers_teacher_code;
DROP INDEX IF EXISTS idx_teachers_status;
DROP INDEX IF EXISTS idx_teachers_department;
DROP INDEX IF EXISTS idx_teachers_specialization;
DROP INDEX IF EXISTS idx_teachers_full_name;
DROP INDEX IF EXISTS idx_classes_class_code;
DROP INDEX IF EXISTS idx_classes_teacher_id;
DROP INDEX IF EXISTS idx_classes_academic_year;
DROP INDEX IF EXISTS idx_classes_semester;
DROP INDEX IF EXISTS idx_classes_status;
DROP INDEX IF EXISTS idx_classes_subject;
DROP INDEX IF EXISTS idx_classes_class_name;
DROP INDEX IF EXISTS idx_enrollments_class_id;
DROP INDEX IF EXISTS idx_enrollments_student_id;
DROP INDEX IF EXISTS idx_enrollments_status;
DROP INDEX IF EXISTS idx_enrollments_enrollment_date;
DROP INDEX IF EXISTS idx_user_id;
DROP INDEX IF EXISTS idx_student_code;
DROP INDEX IF EXISTS idx_teacher_user_id;
DROP INDEX IF EXISTS idx_teacher_code;
DROP INDEX IF EXISTS idx_class_code;
DROP INDEX IF EXISTS idx_teacher_id;
DROP INDEX IF EXISTS idx_enrollment_class_id;
DROP INDEX IF EXISTS idx_enrollment_student_id;

-- Create new indexes with Vietnamese names (IAM)
CREATE INDEX idx_nguoi_dung_email ON nguoi_dung(email);
CREATE INDEX idx_nguoi_dung_ten_dang_nhap ON nguoi_dung(ten_dang_nhap);
CREATE INDEX idx_token_lam_moi_nguoi_dung_id ON token_lam_moi(nguoi_dung_id);
CREATE INDEX idx_token_lam_moi_token_ma_hoa ON token_lam_moi(token_ma_hoa);
CREATE INDEX idx_nhat_ky_bao_mat_nguoi_dung_id ON nhat_ky_bao_mat(nguoi_dung_id);
CREATE INDEX idx_nhat_ky_bao_mat_ngay_tao ON nhat_ky_bao_mat(ngay_tao);

-- Create new indexes with Vietnamese names (HR)
CREATE INDEX idx_sinh_vien_nguoi_dung_id ON sinh_vien(nguoi_dung_id);
CREATE INDEX idx_sinh_vien_ma_sinh_vien ON sinh_vien(ma_sinh_vien);
CREATE INDEX idx_sinh_vien_trang_thai ON sinh_vien(trang_thai);
CREATE INDEX idx_sinh_vien_chuyen_nganh ON sinh_vien(chuyen_nganh);
CREATE INDEX idx_sinh_vien_nam_hoc ON sinh_vien(nam_hoc);
CREATE INDEX idx_sinh_vien_ho_ten ON sinh_vien(ho_ten);

CREATE INDEX idx_giang_vien_nguoi_dung_id ON giang_vien(nguoi_dung_id);
CREATE INDEX idx_giang_vien_ma_giang_vien ON giang_vien(ma_giang_vien);
CREATE INDEX idx_giang_vien_trang_thai ON giang_vien(trang_thai);
CREATE INDEX idx_giang_vien_khoa ON giang_vien(khoa);
CREATE INDEX idx_giang_vien_chuyen_mon ON giang_vien(chuyen_mon);
CREATE INDEX idx_giang_vien_ho_ten ON giang_vien(ho_ten);

CREATE INDEX idx_lop_hoc_ma_lop ON lop_hoc(ma_lop);
CREATE INDEX idx_lop_hoc_giang_vien_id ON lop_hoc(giang_vien_id);
CREATE INDEX idx_lop_hoc_nam_hoc ON lop_hoc(nam_hoc);
CREATE INDEX idx_lop_hoc_hoc_ky ON lop_hoc(hoc_ky);
CREATE INDEX idx_lop_hoc_trang_thai ON lop_hoc(trang_thai);
CREATE INDEX idx_lop_hoc_mon_hoc ON lop_hoc(mon_hoc);
CREATE INDEX idx_lop_hoc_ten_lop ON lop_hoc(ten_lop);

CREATE INDEX idx_dang_ky_lop_hoc_lop_hoc_id ON dang_ky_lop_hoc(lop_hoc_id);
CREATE INDEX idx_dang_ky_lop_hoc_sinh_vien_id ON dang_ky_lop_hoc(sinh_vien_id);
CREATE INDEX idx_dang_ky_lop_hoc_trang_thai ON dang_ky_lop_hoc(trang_thai);
CREATE INDEX idx_dang_ky_lop_hoc_ngay_dang_ky ON dang_ky_lop_hoc(ngay_dang_ky);

-- ============================================
-- UPDATE COMMENTS
-- ============================================

-- IAM comments
COMMENT ON TABLE nguoi_dung IS 'Tài khoản người dùng cho xác thực và phân quyền';
COMMENT ON TABLE vai_tro_nguoi_dung IS 'Phân quyền người dùng';
COMMENT ON TABLE token_lam_moi IS 'JWT refresh tokens';
COMMENT ON TABLE nhat_ky_bao_mat IS 'Nhật ký kiểm toán bảo mật';
COMMENT ON TABLE danh_sach_ip_chan IS 'Danh sách địa chỉ IP bị chặn';
COMMENT ON TABLE thu_dang_nhap_ip IS 'Theo dõi số lần đăng nhập thất bại theo IP';

-- HR comments
COMMENT ON TABLE sinh_vien IS 'Thông tin và hồ sơ sinh viên';
COMMENT ON TABLE giang_vien IS 'Thông tin và hồ sơ giảng viên';
COMMENT ON TABLE lop_hoc IS 'Thông tin lớp học/môn học';
COMMENT ON TABLE dang_ky_lop_hoc IS 'Đăng ký lớp học của sinh viên';
