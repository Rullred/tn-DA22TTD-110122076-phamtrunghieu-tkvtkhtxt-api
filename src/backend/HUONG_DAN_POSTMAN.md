# 📮 HƯỚNG DẪN TEST API TRÊN POSTMAN

## ✅ Xác nhận nhanh

- ✅ IAM Service: `http://localhost:8081`
- ✅ API Gateway: `http://localhost:8080`
- ✅ HR Service: `http://localhost:8082`

---

## 🔧 CÀI ĐẶT POSTMAN

### Bước 1: Tạo Request mới

1. Mở Postman
2. Click **New** → **HTTP Request**
3. Hoặc nhấn `Ctrl + N`

---

## 🧪 CÁC TEST CASE QUAN TRỌNG (IAM)

### Test 1: Đăng nhập SAI

#### URL
```
POST http://localhost:8081/api/auth/login
```

#### Headers
```
Content-Type: application/json
```

#### Body (raw JSON)
```json
{
  "usernameOrEmail": "hieupham",
  "password": "SaiMatKhau123!"
}
```

#### Kết quả mong đợi
- Status: `401 Unauthorized`

---

### Test 2: Đăng nhập ĐÚNG

#### URL
```
POST http://localhost:8081/api/auth/login
```

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "usernameOrEmail": "hieupham",
  "password": "Hieu@123456"
}
```

#### Kết quả mong đợi
- Status: `200 OK`
- Response có `accessToken` (Bearer token)

---

### Test 3: Đăng ký user mới

**URL**:
```
POST http://localhost:8081/api/auth/register
```

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "username": "testuser",
  "email": "testuser@gmail.com",
  "password": "Test@123456",
  "role": "STUDENT"
}
```

**Kết quả mong đợi**: `201 Created` hoặc `200 OK` (tùy cấu hình service).

---

### Test 4: Đăng nhập sai 5 lần → Khóa tạm thời

1) Gửi request đăng nhập sai 5 lần (Test 1)

2) Lần tiếp theo dù đúng mật khẩu vẫn bị chặn:
```json
{
  "usernameOrEmail": "hieupham",
  "password": "Hieu@123456"
}
```

**Kết quả mong đợi**: `403 Forbidden` + message kiểu “Tài khoản đã bị khóa … giây”.

---

### Test 5: Xem danh sách IP bị chặn (Admin)

**URL**:
```
GET http://localhost:8081/api/admin/blocked-ips
```

**Kết quả**: `200 OK` + danh sách IP bị block.

---

### Test 6: Health Check

**URL**:
```
GET http://localhost:8081/actuator/health
```

**Kết quả**:
```json
{
  "status": "UP"
}
```

---

## ➕➖✏️ HƯỚNG DẪN THÊM / SỬA / XÓA (CRUD - Students)

> Khuyến nghị gọi qua **API Gateway** (`http://localhost:8080`) để đúng luồng hệ thống.

### A) Chuẩn bị token

1) Login qua Gateway để lấy `accessToken`:

**URL**:
```
POST http://localhost:8080/api/auth/login
```

**Headers**:
```
Content-Type: application/json
```

**Body** (ví dụ user ADMIN đang có trong DB):
```json
{
  "usernameOrEmail": "hieupham",
  "password": "Hieu@123456"
}
```

2) Set token vào Postman:
- Cách nhanh: thêm Header `Authorization: Bearer <accessToken>` cho từng request
- Cách tiện: tạo Environment variable `access_token`, rồi dùng `Authorization: Bearer {{access_token}}`

---

### B) THÊM sinh viên

> Lưu ý: bảng `students` liên kết 1-1 với `users` (IAM) qua `userId` nên khi tạo Student **bắt buộc** có `userId` (UUID) đã tồn tại trong IAM.

#### B1) Tạo user STUDENT để lấy `userId`

**URL**:
```
POST http://localhost:8080/api/auth/register
```

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "username": "student_demo_01",
  "email": "student_demo_01@example.com",
  "password": "Student@123456",
  "role": "STUDENT"
}
```

**Lấy `userId`** trong response:
- `data.user.id`

#### B2) Tạo Student profile (HR)

**URL**:
```
POST http://localhost:8080/api/students
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "userId": "<UUID lấy từ data.user.id>",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "2000-01-15",
  "gender": "MALE",
  "address": "123 Main St, City",
  "enrollmentDate": "2024-09-01"
}
```

**Kết quả mong đợi**: `201 Created` hoặc `200 OK` + trả về object có `id`.

> Nếu nhận `500 Internal Server Error`, kiểm tra lại 3 điểm sau trước:
> - `userId` phải lấy đúng từ `data.user.id` của response đăng ký user
> - `gender` chỉ nhận `MALE`, `FEMALE`, hoặc `OTHER`
> - Body phải gửi ở tab **Body -> raw -> JSON**, không chỉ đặt `Authorization`

---

### C) SỬA sinh viên

> Lấy `id` trước bằng: `GET http://localhost:8080/api/students?page=0&size=20`

**URL**:
```
PUT http://localhost:8080/api/students/{id}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567891"
}
```

**Kết quả mong đợi**: `200 OK`.

---

### D) XÓA sinh viên

**URL**:
```
DELETE http://localhost:8080/api/students/{id}
```

**Headers**:
```
Authorization: Bearer {{access_token}}
```

**Kết quả mong đợi**: `200 OK` hoặc `204 No Content`.

---

### (Tuỳ chọn) Gọi thẳng HR Service (không qua Gateway)

- `POST http://localhost:8082/api/students`
- `PUT http://localhost:8082/api/students/{id}`
- `DELETE http://localhost:8082/api/students/{id}`

---

## 🚨 KHẮC PHỤC SỰ CỐ

### Vấn đề 1: "Could not get any response" hoặc "Connection refused"

**Nguyên nhân**: Service chưa khởi động hoặc port bị chặn

**Giải pháp**:
```bash
docker-compose ps
docker-compose up -d
docker logs iam-service --tail 50
```

---

### Vấn đề 2: "Timeout" hoặc mất quá lâu

**Nguyên nhân**: Service đang khởi động hoặc database chưa sẵn sàng

**Giải pháp**:
```bash
timeout /t 30
curl http://localhost:8081/actuator/health
```

---

### Vấn đề 3: Không thấy thông báo tiếng Việt

**Nguyên nhân**: Postman không hiển thị UTF-8 đúng

**Giải pháp**:
1. Trong Postman, mở tab **Body** của response
2. Đảm bảo hiển thị UTF-8
3. Hoặc copy response và paste vào editor hỗ trợ UTF-8

---

### Vấn đề 4: "User not found" hoặc "Invalid credentials"

**Nguyên nhân**: User chưa tồn tại hoặc mật khẩu sai

**Giải pháp**:
```bash
docker exec -it postgres psql -U app_user -d student_management_db -c "SELECT username, email FROM users;"
```

---

## 📊 BẢNG TÓM TẮT ENDPOINTS

| Endpoint | Method | Mô tả | Gọi qua |
|----------|--------|-------|--------|
| `/api/auth/register` | POST | Đăng ký | IAM (`:8081`) / Gateway (`:8080`) |
| `/api/auth/login` | POST | Đăng nhập | IAM (`:8081`) / Gateway (`:8080`) |
| `/api/auth/refresh` | POST | Refresh token | IAM / Gateway |
| `/api/auth/logout` | POST | Logout | IAM / Gateway |
| `/api/admin/blocked-ips` | GET | Danh sách IP bị chặn | IAM (`:8081`) |
| `/api/admin/blocked-ips/{ip}` | DELETE | Mở khóa IP | IAM (`:8081`) |
| `/api/students` | GET | Danh sách sinh viên | Gateway (`:8080`) / HR (`:8082`) |
| `/api/students` | POST | Thêm sinh viên | Gateway / HR |
| `/api/students/{id}` | PUT | Sửa sinh viên | Gateway / HR |
| `/api/students/{id}` | DELETE | Xóa sinh viên | Gateway / HR |
| `/actuator/health` | GET | Health check | theo service |

---

## 💡 MẸO SỬ DỤNG POSTMAN

### Import Collection

Repo đã có sẵn collection:
- `backend/postman/Enterprise-Student-Management.postman_collection.json`

Trong Postman: **Import** → chọn file trên.

---

## 🔍 XEM LOGS REAL-TIME

```bash
docker logs iam-service -f
```

---

## 🔒 KIỂM TRA LOGIC KHÓA TÀI KHOẢN

### Quy tắc khóa tài khoản:
- **5 lần sai** → Khóa 15 phút (900 giây)
- **10 lần sai** → Khóa 30 phút (1800 giây)
- **15 lần sai** → Khóa vĩnh viễn + Chặn IP vĩnh viễn

### Test Case: Khóa 15 phút sau 5 lần sai

**Bước 1**: Đăng ký tài khoản test
```
POST http://localhost:8080/api/auth/login
```

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "username": "testlock",
  "email": "testlock@example.com",
  "password": "Test@123456",
  "role": "STUDENT"
}
```

**Bước 2**: Đăng nhập sai 5 lần liên tiếp
```
POST http://localhost:8080/api/auth/login
```

**Body**:
```json
{
  "usernameOrEmail": "testlock",
  "password": "WrongPassword123"
}
```

**Kết quả mong đợi**:
- Lần 1: "Tên đăng nhập hoặc mật khẩu không đúng (1/5)"
- Lần 2: "Tên đăng nhập hoặc mật khẩu không đúng (2/5)"
- Lần 3: "Tên đăng nhập hoặc mật khẩu không đúng (3/5)"
- Lần 4: "Tên đăng nhập hoặc mật khẩu không đúng (4/5)"
- Lần 5: "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị khóa 15 phút (900 giây)."

**Bước 3**: Thử đăng nhập với mật khẩu ĐÚNG
```
POST http://localhost:8080/api/auth/login
```

**Body**:
```json
{
  "usernameOrEmail": "testlock",
  "password": "Test@123456"
}
```

**Kết quả mong đợi**:
- Status: 423 Locked (hoặc 401)
- Message: "Tài khoản đã bị khóa. Vui lòng thử lại sau XXX giây."

**Bước 4**: Đợi 15 phút và thử lại
- Sau 15 phút, tài khoản tự động mở khóa
- Đăng nhập với mật khẩu đúng sẽ thành công

### 📄 Xem chi tiết test cases đầy đủ

Xem file **`TEST_ACCOUNT_LOCKING.md`** để biết chi tiết về:
- ✅ Test khóa 30 phút (10 lần sai)
- ✅ Test khóa vĩnh viễn (15 lần sai)
- ✅ Cách kiểm tra database và Redis
- ✅ Cách reset để test lại
- ✅ Checklist kiểm tra đầy đủ

---

## 🚦 KIỂM TRA RATE LIMITING

Rate Limiting chỉ hoạt động khi gọi **qua API Gateway** (port 8080).

### Test Rate Limiting
```
POST http://localhost:8080/api/auth/login
```

**Body**:
```json
{
  "usernameOrEmail": "admin",
  "password": "wrongpassword"
}
```

**Cấu hình**: 100 requests/giây/IP

**Cách test**:
1. Gửi request liên tục nhiều lần trong 1 giây
2. Sau 100 requests, sẽ nhận được lỗi 429 Too Many Requests

**Lưu ý**: 
- ❌ Nếu gọi trực tiếp vào IAM service (port 8081), sẽ bypass Rate Limiting
- ✅ Luôn sử dụng API Gateway (port 8080) trong production
