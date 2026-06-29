# 🧪 TEST ĐĂNG KÝ USER MỚI

## Bước 1: Đăng ký Admin User

### Request
```
POST http://localhost:8081/api/auth/register
Content-Type: application/json
```

### Body
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin@123456",
  "role": "ADMIN"
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

---

## Bước 2: Đăng nhập

### Request
```
POST http://localhost:8081/api/auth/login
Content-Type: application/json
```

### Body
```json
{
  "usernameOrEmail": "admin",
  "password": "Admin@123456"
}
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

---

## Bước 3: Sử dụng Token

Copy `accessToken` và paste vào Swagger UI:
1. Click nút **Authorize** 
2. Paste token vào ô input
3. Click **Authorize**
4. Click **Close**

Bây giờ bạn có thể test tất cả API!

---

## 📝 LƯU Ý

- Password phải có ít nhất 8 ký tự
- Password phải chứa: chữ hoa, chữ thường, số, ký tự đặc biệt
- Role có thể là: `ADMIN`, `TEACHER`, `STUDENT`
