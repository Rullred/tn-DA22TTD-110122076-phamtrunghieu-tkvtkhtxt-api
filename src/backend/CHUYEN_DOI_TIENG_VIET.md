# 📋 TÀI LIỆU CHUYỂN ĐỔI CƠ SỞ DỮ LIỆU SANG TIẾNG VIỆT

## 🎯 MỤC TIÊU
Chuyển đổi toàn bộ tên bảng, cột và enum values từ tiếng Anh sang tiếng Việt để đảm bảo sự tương đồng hoàn toàn giữa mã nguồn và cơ sở dữ liệu.

## 📊 BẢNG CHUYỂN ĐỔI

### IAM SERVICE

#### Bảng (Tables)
| Tên cũ (English) | Tên mới (Tiếng Việt) |
|------------------|----------------------|
| `users` | `nguoi_dung` |
| `user_roles` | `vai_tro_nguoi_dung` |
| `refresh_tokens` | `token_lam_moi` |
| `security_logs` | `nhat_ky_bao_mat` |
| `ip_blacklist` | `danh_sach_ip_chan` |
| `ip_login_attempts` | `thu_dang_nhap_ip` |

#### Cột chính (Main Columns)
| Tên cũ | Tên mới |
|--------|---------|
| `username` | `ten_dang_nhap` |
| `email` | `email` |
| `password_hash` | `mat_khau_ma_hoa` |
| `role` | `vai_tro` |
| `is_locked` | `bi_khoa` |
| `locked_until` | `khoa_den` |
| `enabled` | `kich_hoat` |
| `failed_login_attempts` | `so_lan_dang_nhap_that_bai` |
| `last_login_at` | `lan_dang_nhap_cuoi` |
| `last_login_ip` | `ip_dang_nhap_cuoi` |
| `created_at` | `ngay_tao` |
| `updated_at` | `ngay_cap_nhat` |
| `created_by` | `nguoi_tao` |
| `updated_by` | `nguoi_cap_nhat` |

### HR SERVICE

#### Bảng (Tables)
| Tên cũ (English) | Tên mới (Tiếng Việt) |
|------------------|----------------------|
| `students` | `sinh_vien` |
| `teachers` | `giang_vien` |
| `classes` | `lop_hoc` |
| `class_enrollments` | `dang_ky_lop_hoc` |

#### Cột sinh_vien (students)
| Tên cũ | Tên mới |
|--------|---------|
| `user_id` | `nguoi_dung_id` |
| `student_code` | `ma_sinh_vien` |
| `first_name` | `ten` |
| `last_name` | `ho` |
| `full_name` | `ho_ten` |
| `date_of_birth` | `ngay_sinh` |
| `phone_number` | `so_dien_thoai` |
| `address` | `dia_chi` |
| `gender` | `gioi_tinh` |
| `avatar_url` | `anh_dai_dien` |
| `enrollment_date` | `ngay_nhap_hoc` |
| `major` | `chuyen_nganh` |
| `academic_year` | `nam_hoc` |
| `status` | `trang_thai` |

#### Cột giang_vien (teachers)
| Tên cũ | Tên mới |
|--------|---------|
| `user_id` | `nguoi_dung_id` |
| `teacher_code` | `ma_giang_vien` |
| `first_name` | `ten` |
| `last_name` | `ho` |
| `full_name` | `ho_ten` |
| `department` | `khoa` |
| `specialization` | `chuyen_mon` |
| `hire_date` | `ngay_tuyen_dung` |
| `office_location` | `phong_lam_viec` |

#### Cột lop_hoc (classes)
| Tên cũ | Tên mới |
|--------|---------|
| `class_code` | `ma_lop` |
| `class_name` | `ten_lop` |
| `teacher_id` | `giang_vien_id` |
| `academic_year` | `nam_hoc` |
| `semester` | `hoc_ky` |
| `subject` | `mon_hoc` |
| `room` | `phong_hoc` |
| `schedule` | `lich_hoc` |
| `max_students` | `so_sinh_vien_toi_da` |
| `current_students` | `so_sinh_vien_hien_tai` |
| `start_date` | `ngay_bat_dau` |
| `end_date` | `ngay_ket_thuc` |
| `description` | `mo_ta` |

#### Cột dang_ky_lop_hoc (class_enrollments)
| Tên cũ | Tên mới |
|--------|---------|
| `class_id` | `lop_hoc_id` |
| `student_id` | `sinh_vien_id` |
| `enrollment_date` | `ngay_dang_ky` |
| `grade` | `diem` |
| `attendance_rate` | `ty_le_diem_danh` |
| `notes` | `ghi_chu` |
| `dropped_at` | `ngay_bo_hoc` |

## 🔄 ENUM VALUES

### Student.Gender
| Cũ | Mới |
|----|-----|
| `MALE` | `NAM` |
| `FEMALE` | `NU` |
| `OTHER` | `KHAC` |

### Student.StudentStatus
| Cũ | Mới |
|----|-----|
| `ACTIVE` | `HOAT_DONG` |
| `INACTIVE` | `KHONG_HOAT_DONG` |
| `GRADUATED` | `DA_TOT_NGHIEP` |
| `SUSPENDED` | `BI_DINH_CHI` |

### Teacher.TeacherStatus
| Cũ | Mới |
|----|-----|
| `ACTIVE` | `HOAT_DONG` |
| `INACTIVE` | `KHONG_HOAT_DONG` |
| `ON_LEAVE` | `NGHI_PHEP` |
| `RETIRED` | `DA_NGHI_HUU` |

### SchoolClass.ClassStatus
| Cũ | Mới |
|----|-----|
| `ACTIVE` | `HOAT_DONG` |
| `INACTIVE` | `KHONG_HOAT_DONG` |
| `COMPLETED` | `DA_HOAN_THANH` |
| `CANCELLED` | `DA_HUY` |

### ClassEnrollment.EnrollmentStatus
| Cũ | Mới |
|----|-----|
| `ENROLLED` | `DA_DANG_KY` |
| `COMPLETED` | `DA_HOAN_THANH` |
| `DROPPED` | `DA_BO_HOC` |
| `FAILED` | `THAT_BAI` |

## 📝 CÁC FILE ĐÃ THAY ĐỔI

### Migration Files
1. `iam-service/src/main/resources/db/migration/V2__rename_to_vietnamese.sql`
2. `hr-service/src/main/resources/db/migration/V2__rename_to_vietnamese.sql`

### Entity Classes (IAM Service)
1. `User.java` - Cập nhật @Table và @Column annotations
2. `RefreshToken.java` - Cập nhật @Table và @Column annotations
3. `SecurityLog.java` - Cập nhật @Table và @Column annotations
4. `IpBlacklist.java` - Cập nhật @Table và @Column annotations
5. `IpLoginAttempt.java` - Cập nhật @Table và @Column annotations
6. `AuditableEntity.java` - Cập nhật @Column annotations

### Entity Classes (HR Service)
1. `Student.java` - Cập nhật @Table, @Column và enum values
2. `Teacher.java` - Cập nhật @Table, @Column, enum values và thêm field `fullName`, `officeLocation`
3. `SchoolClass.java` - Cập nhật @Table, @Column và enum values
4. `ClassEnrollment.java` - Cập nhật @Table, @Column và enum values
5. `AuditableEntity.java` - Cập nhật @Column annotations

### Service Classes
1. `StudentService.java` - Cập nhật native SQL query và enum values
2. `TeacherService.java` - Cập nhật enum values
3. `ClassService.java` - Cập nhật enum values

### Test Classes
1. `StudentServiceTest.java` - Cập nhật enum values
2. `StudentControllerTest.java` - Cập nhật enum values

## ✅ CẢI TIẾN BỔ SUNG

### Teacher Entity
- ✅ Thêm field `fullName` (ho_ten) - tự động tạo từ firstName + lastName
- ✅ Thêm field `officeLocation` (phong_lam_viec) - đã có trong database nhưng thiếu trong entity
- ✅ Thêm method `@PrePersist` và `@PreUpdate` để tự động populate fullName

## 🚀 CÁCH SỬ DỤNG

### 1. Rebuild và Khởi động Services
```bash
cd backend
docker-compose down
docker-compose up --build
```

### 2. Migration sẽ tự động chạy
Flyway sẽ tự động phát hiện và chạy file migration V2 khi services khởi động.

### 3. Kiểm tra Database
```bash
docker exec -it postgres psql -U app_user -d student_management_db

# Kiểm tra tên bảng mới
\dt

# Kiểm tra cấu trúc bảng
\d sinh_vien
\d giang_vien
\d lop_hoc
\d dang_ky_lop_hoc
```

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup Database**: Luôn backup database trước khi chạy migration
2. **Enum Values**: Tất cả enum values đã được chuyển sang tiếng Việt
3. **API Requests**: Khi gửi request, sử dụng enum values mới:
   - `"gender": "NAM"` thay vì `"MALE"`
   - `"status": "HOAT_DONG"` thay vì `"ACTIVE"`
4. **Compatibility**: Migration V2 sẽ rename tất cả bảng và cột, không tạo bảng mới

## 🧪 TEST VỚI POSTMAN

### Ví dụ tạo Student mới
```json
{
  "userId": "<UUID từ user đã tạo>",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "email": "nguyenvana@example.com",
  "phoneNumber": "+84123456789",
  "dateOfBirth": "2000-01-15",
  "gender": "NAM",
  "address": "123 Đường ABC, TP.HCM",
  "enrollmentDate": "2024-09-01"
}
```

### Ví dụ tạo Teacher mới
```json
{
  "userId": "<UUID từ user đã tạo>",
  "firstName": "Trần",
  "lastName": "Thị B",
  "email": "tranthib@example.com",
  "phoneNumber": "+84987654321",
  "dateOfBirth": "1985-05-20",
  "gender": "NU",
  "department": "Khoa Công Nghệ Thông Tin",
  "specialization": "Lập trình Web",
  "address": "456 Đường XYZ, Hà Nội",
  "hireDate": "2020-09-01"
}
```

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker logs iam-service` hoặc `docker logs hr-service`
2. Kiểm tra database: Kết nối vào PostgreSQL và xem cấu trúc bảng
3. Rollback nếu cần: Xóa database volume và khởi động lại từ V1

---

**Ngày cập nhật**: 31/05/2026
**Phiên bản**: 2.0.0
