# 📧 HƯỚNG DẪN CẤU HÌNH EMAIL OTP CHO ADMIN

## 🎯 Mục tiêu
Cấu hình hệ thống để gửi mã OTP đến email: **phamtrunghieudhi1301@gmail.com**

---

## ✅ BƯỚC 1: TẠO APP PASSWORD GMAIL

### 1.1. Truy cập Google Account Security
- Mở trình duyệt và vào: https://myaccount.google.com/security
- Đăng nhập với tài khoản: **phamtrunghieudhi1301@gmail.com**

### 1.2. Bật xác thực 2 bước (nếu chưa có)
1. Tìm mục **"2-Step Verification"** (Xác minh 2 bước)
2. Click **"Get started"** và làm theo hướng dẫn
3. Có thể dùng số điện thoại hoặc app Google Authenticator

### 1.3. Tạo App Password
1. Sau khi bật 2-Step Verification, quay lại trang Security
2. Tìm mục **"App passwords"** (Mật khẩu ứng dụng)
   - Link trực tiếp: https://myaccount.google.com/apppasswords
3. Chọn:
   - **App:** Mail
   - **Device:** Other (Custom name)
   - **Name:** Student Management System OTP
4. Click **"Generate"** (Tạo)
5. Google sẽ hiển thị mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
6. **⚠️ QUAN TRỌNG:** Sao chép mật khẩu này (bỏ khoảng trắng)

---

## ✅ BƯỚC 2: CẬP NHẬT FILE .ENV

### 2.1. Mở file cấu hình
```bash
# Mở file này bằng Notepad hoặc VS Code
a:\DATN\backend\.env
```

### 2.2. Tìm dòng cấu hình email
Tìm dòng:
```env
MAIL_USERNAME=phamtrunghieudhi1301@gmail.com
MAIL_PASSWORD=YOUR_16_CHARACTER_APP_PASSWORD_HERE
```

### 2.3. Điền App Password
Thay thế `YOUR_16_CHARACTER_APP_PASSWORD_HERE` bằng mật khẩu 16 ký tự (không có khoảng trắng)

**Ví dụ:**
```env
MAIL_USERNAME=phamtrunghieudhi1301@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
```

### 2.4. Lưu file
- Nhấn **Ctrl + S** để lưu file
- **⚠️ QUAN TRỌNG:** Không commit file này lên Git (đã có trong .gitignore)

---

## ✅ BƯỚC 3: KHỞI ĐỘNG LẠI IAM SERVICE

### Cách 1: Restart container (Nhanh nhất)
```bash
cd a:\DATN\backend
docker-compose restart iam-service
```

### Cách 2: Rebuild và restart toàn bộ
```bash
cd a:\DATN\backend
docker-compose down
docker-compose up -d --build
```

### Kiểm tra logs
```bash
docker logs iam-service --tail 50 -f
```

**Chờ thông báo:** "Started IamServiceApplication"

---

## ✅ BƯỚC 4: KIỂM TRA CHỨC NĂNG OTP

### 4.1. Đăng nhập Admin
1. Mở trình duyệt: http://localhost:5173
2. Đăng nhập với:
   - **Email/Username:** `phamtrunghieudhi1301@gmail.com` hoặc `admin`
   - **Password:** `admin123`

### 4.2. Nhận OTP
1. Hệ thống sẽ yêu cầu nhập mã OTP
2. **Kiểm tra email:** phamtrunghieudhi1301@gmail.com
3. Email có tiêu đề: **"CET SmartPortal - Mã xác thực đăng nhập (OTP)"**
4. Trong email sẽ có mã 6 chữ số (ví dụ: `123456`)

### 4.3. Nhập OTP
1. Nhập mã 6 chữ số từ email
2. Click "Xác nhận"
3. Nếu thành công → Vào dashboard

---

## 🔍 TROUBLESHOOTING

### ❌ Không nhận được email
**Nguyên nhân và giải pháp:**

1. **Kiểm tra thư mục Spam/Junk**
   - Email có thể bị Gmail đánh dấu spam lần đầu

2. **Kiểm tra App Password đúng chưa**
   ```bash
   # Xem logs để kiểm tra lỗi xác thực
   docker logs iam-service --tail 100 | grep -i "mail"
   ```
   - Nếu thấy "Authentication failed" → App Password sai

3. **Kiểm tra 2-Step Verification đã bật chưa**
   - Vào: https://myaccount.google.com/security
   - Phải có "2-Step Verification: ON"

4. **Tạo lại App Password**
   - Xóa App Password cũ
   - Tạo mới và cập nhật lại .env
   - Restart IAM service

---

### ❌ Lỗi: "Mail server connection failed"

**Kiểm tra:**
```bash
# Xem chi tiết lỗi
docker logs iam-service --tail 200
```

**Nguyên nhân phổ biến:**
1. App Password sai hoặc có khoảng trắng
2. 2-Step Verification chưa bật
3. Google chặn "Less secure app access" (không dùng App Password)

**Giải pháp:**
- Đảm bảo dùng **App Password**, không dùng mật khẩu Gmail thông thường
- Xóa khoảng trắng trong App Password
- Restart IAM service sau khi sửa

---

### ❌ Email gửi chậm (> 10 giây)

**Nguyên nhân:** Timeout cấu hình trong application.yml

**Giải pháp:** Kiểm tra cấu hình SMTP timeout
```yaml
spring:
  mail:
    properties:
      mail:
        smtp:
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000
```

---

## 📊 KIỂM TRA LOGS

### Xem OTP được sinh ra
```bash
docker logs iam-service --tail 100 | grep "Generated OTP"
```

**Output mong đợi:**
```
Generated OTP: 123456 for user: admin with tempToken: abc-def-ghi
Sending OTP email to: phamtrunghieudhi1301@gmail.com
OTP email successfully sent to: phamtrunghieudhi1301@gmail.com
```

### Xem lỗi email (nếu có)
```bash
docker logs iam-service --tail 100 | grep -i "error\|exception"
```

---

## ✨ KẾT QUẢ MONG ĐỢI

Sau khi cấu hình thành công:

1. ✅ Admin đăng nhập với email: `phamtrunghieudhi1301@gmail.com`
2. ✅ Hệ thống sinh mã OTP 6 chữ số
3. ✅ Email OTP được gửi đến inbox trong vòng 2-5 giây
4. ✅ Admin nhập OTP và đăng nhập thành công
5. ✅ Không cần xem logs để lấy OTP nữa!

---

## 🔐 BẢO MẬT

### ⚠️ LƯU Ý QUAN TRỌNG:

1. **KHÔNG commit file .env lên Git**
   - File đã được thêm vào `.gitignore`
   - Chứa thông tin nhạy cảm (App Password)

2. **KHÔNG chia sẻ App Password**
   - Nếu lộ, hãy vào Google Account và revoke ngay
   - Tạo App Password mới

3. **Thay đổi App Password định kỳ**
   - Khuyến nghị: 3-6 tháng/lần

4. **Sao lưu cấu hình**
   - Lưu App Password ở nơi an toàn (password manager)
   - Để dễ restore khi cần

---

## 📞 HỖ TRỢ

Nếu vẫn gặp vấn đề:

1. Kiểm tra logs: `docker logs iam-service --tail 200`
2. Đảm bảo đã làm đúng các bước trên
3. Thử tạo lại App Password
4. Kiểm tra kết nối internet

---

**Chúc bạn cấu hình thành công! 🎉**

---

## 📋 CHECKLIST

- [ ] Đăng nhập Google Account: phamtrunghieudhi1301@gmail.com
- [ ] Bật 2-Step Verification
- [ ] Tạo App Password cho "Student Management System"
- [ ] Copy App Password (16 ký tự)
- [ ] Cập nhật MAIL_PASSWORD trong file .env
- [ ] Lưu file .env
- [ ] Restart IAM service: `docker-compose restart iam-service`
- [ ] Kiểm tra logs: `docker logs iam-service --tail 50`
- [ ] Test đăng nhập với admin
- [ ] Kiểm tra email inbox
- [ ] Nhập OTP và đăng nhập thành công

---

**Thời gian hoàn thành:** ~5-10 phút

