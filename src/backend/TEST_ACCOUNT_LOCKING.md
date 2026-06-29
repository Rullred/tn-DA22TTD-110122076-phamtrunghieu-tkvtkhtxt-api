# KIỂM TRA LOGIC KHÓA TÀI KHOẢN

## Tổng quan Logic Khóa Tài Khoản

### Cấu hình hiện tại:
- **5 lần sai** → Khóa 15 phút (900 giây)
- **10 lần sai** → Khóa 30 phút (1800 giây)  
- **15 lần sai** → Khóa vĩnh viễn + Chặn IP vĩnh viễn

### Thông báo lỗi:
- **Lần 1-4**: "Tên đăng nhập hoặc mật khẩu không đúng (X/5)"
- **Lần 5**: "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị khóa 15 phút (900 giây)."
- **Lần 6-9**: "Tên đăng nhập hoặc mật khẩu không đúng (X/5)" (counter reset về 1-4)
- **Lần 10**: "Bạn đã nhập sai mật khẩu 10 lần. Tài khoản đã bị khóa 30 phút (1800 giây)."
- **Lần 15**: "Tài khoản đã bị khóa vĩnh viễn do vi phạm bảo mật nghiêm trọng. Vui lòng liên hệ Admin."

---

## TEST CASE 1: Khóa 15 phút sau 5 lần sai

### Bước 1: Đăng ký tài khoản test
```
POST http://localhost:8080/api/iam/auth/register

Body:
{
  "username": "testlock1",
  "email": "testlock1@example.com",
  "password": "Test@123456",
  "role": "STUDENT"
}
```

**Kết quả mong đợi**: 
- Status: 200 OK
- Nhận được access_token và refresh_token

### Bước 2: Đăng nhập sai 5 lần liên tiếp

**Lần 1:**
```
POST http://localhost:8080/api/iam/auth/login

Body:
{
  "usernameOrEmail": "testlock1",
  "password": "WrongPassword123"
}
```

**Kết quả mong đợi**:
- Status: 401 Unauthorized
- Message: "Tên đăng nhập hoặc mật khẩu không đúng (1/5)"

**Lần 2:**
- Gửi lại request trên
- Message: "Tên đăng nhập hoặc mật khẩu không đúng (2/5)"

**Lần 3:**
- Gửi lại request trên
- Message: "Tên đăng nhập hoặc mật khẩu không đúng (3/5)"

**Lần 4:**
- Gửi lại request trên
- Message: "Tên đăng nhập hoặc mật khẩu không đúng (4/5)"

**Lần 5:**
- Gửi lại request trên
- **Status: 423 Locked** (hoặc 401 với message khóa)
- **Message: "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị khóa 15 phút (900 giây)."**

### Bước 3: Thử đăng nhập với mật khẩu ĐÚNG
```
POST http://localhost:8080/api/iam/auth/login

Body:
{
  "usernameOrEmail": "testlock1",
  "password": "Test@123456"
}
```

**Kết quả mong đợi**:
- Status: 423 Locked
- Message: "Tài khoản đã bị khóa. Vui lòng thử lại sau XXX giây."
- XXX sẽ giảm dần từ 900 → 0

### Bước 4: Đợi 15 phút và thử lại
- Đợi 15 phút (hoặc kiểm tra trong database/Redis)
- Thử đăng nhập lại với mật khẩu đúng

**Kết quả mong đợi**:
- Status: 200 OK
- Đăng nhập thành công
- `failedLoginAttempts` được reset về 0

---

## TEST CASE 2: Khóa 30 phút sau 10 lần sai

### Bước 1: Đăng ký tài khoản test mới
```
POST http://localhost:8080/api/iam/auth/register

Body:
{
  "username": "testlock2",
  "email": "testlock2@example.com",
  "password": "Test@123456",
  "role": "STUDENT"
}
```

### Bước 2: Đăng nhập sai 10 lần liên tiếp
- Lần 1-4: Hiển thị (1/5), (2/5), (3/5), (4/5)
- **Lần 5**: Khóa 15 phút
- Đợi 15 phút để tài khoản tự động mở khóa
- Lần 6-9: Hiển thị (1/5), (2/5), (3/5), (4/5)
- **Lần 10**: Khóa 30 phút với message "Bạn đã nhập sai mật khẩu 10 lần. Tài khoản đã bị khóa 30 phút (1800 giây)."

### Bước 3: Verify khóa 30 phút
- Thử đăng nhập với mật khẩu đúng
- Phải bị từ chối với message còn XXX giây (từ 1800 giảm dần)

---

## TEST CASE 3: Khóa vĩnh viễn + Chặn IP sau 15 lần sai

### ⚠️ CẢNH BÁO: Test này sẽ chặn IP của bạn vĩnh viễn!

### Bước 1: Đăng ký tài khoản test mới
```
POST http://localhost:8080/api/iam/auth/register

Body:
{
  "username": "testlock3",
  "email": "testlock3@example.com",
  "password": "Test@123456",
  "role": "STUDENT"
}
```

### Bước 2: Đăng nhập sai 15 lần
- Lần 1-5: Khóa 15 phút
- Đợi 15 phút
- Lần 6-10: Khóa 30 phút
- Đợi 30 phút
- Lần 11-14: Hiển thị (1/5), (2/5), (3/5), (4/5)
- **Lần 15**: Khóa vĩnh viễn + Chặn IP

**Kết quả mong đợi lần 15**:
- Status: 423 Locked
- Message: "Tài khoản đã bị khóa vĩnh viễn do vi phạm bảo mật nghiêm trọng. Vui lòng liên hệ Admin."

### Bước 3: Verify IP bị chặn
- Thử đăng nhập bất kỳ tài khoản nào khác
- Phải nhận message: "Địa chỉ IP của bạn đã bị chặn do hoạt động đáng ngờ"

---

## KIỂM TRA DATABASE

### Kiểm tra bảng `nguoi_dung` (users)
```sql
SELECT 
    ten_dang_nhap,
    so_lan_dang_nhap_sai,
    bi_khoa,
    khoa_den_luc,
    dang_nhap_cuoi_luc,
    dang_nhap_cuoi_ip
FROM nguoi_dung
WHERE ten_dang_nhap IN ('testlock1', 'testlock2', 'testlock3');
```

**Kết quả mong đợi sau test**:
- `testlock1`: `so_lan_dang_nhap_sai = 5`, `bi_khoa = true`, `khoa_den_luc` = thời gian + 15 phút
- `testlock2`: `so_lan_dang_nhap_sai = 10`, `bi_khoa = true`, `khoa_den_luc` = thời gian + 30 phút
- `testlock3`: `so_lan_dang_nhap_sai = 15`, `bi_khoa = true`, `khoa_den_luc = NULL` (vĩnh viễn)

### Kiểm tra Redis counters
```bash
# Kết nối vào Redis container
docker exec -it redis redis-cli

# Kiểm tra user counter
GET failed_login:user:testlock1
GET failed_login:user:testlock2

# Kiểm tra IP counter
GET failed_login:ip:127.0.0.1

# Kiểm tra account lock
GET account_lock:testlock1
GET account_lock:testlock2

# Kiểm tra IP blacklist
GET ip_blacklist:127.0.0.1
```

---

## KIỂM TRA LOGS

### Xem logs của IAM service
```bash
docker logs iam-service --tail 100 -f
```

**Logs mong đợi thấy**:
- `WARN` - Tài khoản bị khóa 15 phút sau 5 lần đăng nhập sai
- `WARN` - Tài khoản bị khóa 30 phút sau 10 lần đăng nhập sai
- `ERROR` - Tài khoản và IP bị chặn vĩnh viễn sau 15 lần đăng nhập sai

---

## CÁCH RESET ĐỂ TEST LẠI

### Reset tài khoản trong database
```sql
UPDATE nguoi_dung 
SET so_lan_dang_nhap_sai = 0,
    bi_khoa = false,
    khoa_den_luc = NULL
WHERE ten_dang_nhap IN ('testlock1', 'testlock2', 'testlock3');
```

### Reset Redis counters
```bash
docker exec -it redis redis-cli

# Xóa tất cả counters
DEL failed_login:user:testlock1
DEL failed_login:user:testlock2
DEL failed_login:user:testlock3
DEL failed_login:ip:127.0.0.1
DEL account_lock:testlock1
DEL account_lock:testlock2
DEL account_lock:testlock3
DEL ip_blacklist:127.0.0.1
```

### Hoặc reset toàn bộ Redis
```bash
docker exec -it redis redis-cli FLUSHALL
```

---

## CHECKLIST KIỂM TRA

- [ ] Lần 1-4 hiển thị đúng counter (1/5), (2/5), (3/5), (4/5)
- [ ] Lần 5 khóa 15 phút với message đúng
- [ ] Không thể đăng nhập khi bị khóa (kể cả mật khẩu đúng)
- [ ] Hiển thị thời gian còn lại chính xác
- [ ] Tự động mở khóa sau 15 phút
- [ ] Counter reset về 0 sau khi đăng nhập thành công
- [ ] Lần 10 khóa 30 phút với message đúng
- [ ] Lần 15 khóa vĩnh viễn + chặn IP
- [ ] IP bị chặn không thể đăng nhập bất kỳ tài khoản nào
- [ ] Database `so_lan_dang_nhap_sai` được cập nhật đúng
- [ ] Redis counters được cập nhật đúng
- [ ] Logs ghi nhận đầy đủ các sự kiện

---

## GHI CHÚ QUAN TRỌNG

1. **Counter hiển thị**: Code hiện tại hiển thị counter theo pattern (X/5) với X = `currentAttempts % 5`. Điều này có nghĩa:
   - Lần 1-4: Hiển thị (1/5), (2/5), (3/5), (4/5)
   - Lần 5: Khóa 15 phút
   - Lần 6-9: Hiển thị (1/5), (2/5), (3/5), (4/5) (counter reset về 1-4)
   - Lần 10: Khóa 30 phút
   - Lần 11-14: Hiển thị (1/5), (2/5), (3/5), (4/5)
   - Lần 15: Khóa vĩnh viễn

2. **Transaction handling**: Code sử dụng `@Transactional(propagation = REQUIRES_NEW)` cho method `handleFailedLogin()` để đảm bảo database được cập nhật ngay cả khi exception được throw.

3. **Redis + Database**: Hệ thống sử dụng cả Redis (để tracking nhanh) và Database (để lưu trữ lâu dài). Cần kiểm tra cả hai.

4. **IP Blacklist**: Sau 15 lần sai, IP sẽ bị chặn vĩnh viễn. Chỉ Admin mới có thể mở khóa.

5. **Auto-unlock**: Tài khoản tự động mở khóa sau thời gian quy định (15 phút hoặc 30 phút) thông qua method `user.unlockIfExpired()`.
