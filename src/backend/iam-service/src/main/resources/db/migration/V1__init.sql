-- ============================================
-- UNIFIED DATABASE SCHEMA
-- Contains all tables for IAM and HR services
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- IAM SERVICE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_until TIMESTAMP WITH TIME ZONE,
    enabled BOOLEAN NOT NULL,
    failed_login_attempts INTEGER NOT NULL,
    lock_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- User roles table
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security logs table
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    result VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    message VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- IP blacklist table
CREATE TABLE ip_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    blocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255)
);

-- IP login attempts table
CREATE TABLE ip_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    failed_attempts INTEGER NOT NULL,
    last_failed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- HR SERVICE TABLES
-- ============================================

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    avatar_url VARCHAR(500),
    enrollment_date DATE,
    major VARCHAR(100),
    academic_year VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    teacher_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    department VARCHAR(100),
    avatar_url VARCHAR(500),
    specialization VARCHAR(100),
    address VARCHAR(255),
    hire_date DATE,
    office_location VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'RETIRED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_code VARCHAR(20) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    teacher_id UUID,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    subject VARCHAR(100),
    room VARCHAR(50),
    schedule VARCHAR(255),
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_class_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- Class enrollments table
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL,
    student_id UUID NOT NULL,
    enrollment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
    grade VARCHAR(10),
    attendance_rate DOUBLE PRECISION,
    notes VARCHAR(500),
    dropped_at TIMESTAMP,
    CONSTRAINT fk_enrollment_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uk_class_student UNIQUE (class_id, student_id),
    CONSTRAINT chk_enrollment_status CHECK (status IN ('ENROLLED', 'COMPLETED', 'DROPPED', 'FAILED')),
    CONSTRAINT chk_attendance_rate CHECK (attendance_rate IS NULL OR (attendance_rate >= 0 AND attendance_rate <= 100))
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- IAM indexes (already have unique constraints, minimal additional indexes needed)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);

-- Student indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_major ON students(major);
CREATE INDEX idx_students_academic_year ON students(academic_year);
CREATE INDEX idx_students_full_name ON students(full_name);

-- Teacher indexes
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_teacher_code ON teachers(teacher_code);
CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_teachers_department ON teachers(department);
CREATE INDEX idx_teachers_specialization ON teachers(specialization);
CREATE INDEX idx_teachers_full_name ON teachers(full_name);

-- Class indexes
CREATE INDEX idx_classes_class_code ON classes(class_code);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_semester ON classes(semester);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_subject ON classes(subject);
CREATE INDEX idx_classes_class_name ON classes(class_name);

-- Enrollment indexes
CREATE INDEX idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_enrollments_status ON class_enrollments(status);
CREATE INDEX idx_enrollments_enrollment_date ON class_enrollments(enrollment_date);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

-- IAM tables
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON TABLE user_roles IS 'User role assignments';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens';
COMMENT ON TABLE security_logs IS 'Security audit logs';
COMMENT ON TABLE ip_blacklist IS 'Blocked IP addresses';
COMMENT ON TABLE ip_login_attempts IS 'Failed login attempt tracking by IP';

-- HR tables
COMMENT ON TABLE students IS 'Student information and profiles';
COMMENT ON TABLE teachers IS 'Teacher information and profiles';
COMMENT ON TABLE classes IS 'Class/Course information';
COMMENT ON TABLE class_enrollments IS 'Student enrollment in classes';
