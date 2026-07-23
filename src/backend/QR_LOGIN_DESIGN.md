# QR Code Login - Thiết kế hệ thống

## 🎯 Mục tiêu
Thay thế OTP bằng mã QR động để đăng nhập an toàn và tiện lợi hơn.

## 📋 Flow hoạt động

### Bước 1: User mở trang đăng nhập
```
Browser                          Backend
   |                                |
   |--- GET /login page ---------->|
   |<-- Return login form ----------|
```

### Bước 2: User nhập username/password
```
Browser                          Backend                    Redis
   |                                |                          |
   |--- POST /api/auth/login ------>|                          |
   |    {username, password}        |                          |
   |                                |--- Verify credentials -->|
   |                                |                          |
   |                                |--- Generate loginToken ->|
   |                                |    (UUID)                |
   |                                |                          |
   |                                |--- Store in Redis ------>|
   |                                |    Key: qr:login:{token} |
   |                                |    Value: {userId}       |
   |                                |    TTL: 2 minutes        |
   |                                |                          |
   |                                |--- Generate QR Code ----->
   |                                |    Data: loginToken      |
   |                                |                          |
   |<-- Return QR Code (base64) ----|                          |
   |    + loginToken                |                          |
```

### Bước 3: Browser hiển thị QR và polling
```
Browser                          Backend                    Redis
   |                                |                          |
   |--- Show QR Code to user        |                          |
   |                                |                          |
   |--- Start polling ------------->|                          |
   |    GET /api/auth/qr-status     |                          |
   |    ?token={loginToken}         |                          |
   |                                |                          |
   |                                |--- Check Redis --------->|
   |                                |<-- Status: PENDING ------|
   |<-- {status: "PENDING"} --------|                          |
   |                                |                          |
   |--- Poll again (every 2s) ----->|                          |
```

### Bước 4: User quét QR bằng Mobile App
```
Mobile App                       Backend                    Redis
   |                                |                          |
   |--- Scan QR Code                |                          |
   |    Extract: loginToken         |                          |
   |                                |                          |
   |--- POST /api/auth/qr-confirm ->|                          |
   |    {loginToken}                |                          |
   |    Header: Authorization       |                          |
   |    (mobile token)              |                          |
   |                                |                          |
   |                                |--- Verify mobile token ->|
   |                                |    Get userId            |
   |                                |                          |
   |                                |--- Update Redis -------->|
   |                                |    Key: qr:login:{token} |
   |                                |    Value: CONFIRMED      |
   |                                |                          |
   |<-- {success: true} ------------|                          |
```

### Bước 5: Browser nhận xác nhận và đăng nhập
```
Browser                          Backend                    Redis
   |                                |                          |
   |--- Poll again ---------------->|                          |
   |    GET /api/auth/qr-status     |                          |
   |                                |                          |
   |                                |--- Check Redis --------->|
   |                                |<-- Status: CONFIRMED ----|
   |                                |    + userId              |
   |                                |                          |
   |                                |--- Generate JWT tokens ->|
   |                                |                          |
   |<-- {                           |                          |
   |      status: "CONFIRMED",      |                          |
   |      accessToken: "...",       |                          |
   |      refreshToken: "..."       |                          |
   |    } --------------------------|                          |
   |                                |                          |
   |--- Redirect to dashboard       |                          |
```

## 🔐 Cấu trúc dữ liệu

### 1. QR Login Token (Redis)
```json
Key: "qr:login:{loginToken}"
Value: {
  "userId": "uuid",
  "username": "admin",
  "status": "PENDING|CONFIRMED|EXPIRED",
  "createdAt": 1234567890,
  "confirmedAt": 1234567891
}
TTL: 120 seconds (2 phút)
```

### 2. Login Request DTO
```java
public class LoginRequest {
    private String usernameOrEmail;
    private String password;
}
```

### 3. QR Login Response DTO
```java
public class QrLoginResponse {
    private String loginToken;        // UUID
    private String qrCodeDataUrl;     // data:image/png;base64,...
    private long expiresIn;           // 120 seconds
    private String instruction;       // "Quét mã QR bằng ứng dụng di động"
}
```

### 4. QR Status Response DTO
```java
public class QrStatusResponse {
    private String status;            // PENDING, CONFIRMED, EXPIRED
    private String accessToken;       // Chỉ có khi CONFIRMED
    private String refreshToken;      // Chỉ có khi CONFIRMED
    private UserResponse user;        // Chỉ có khi CONFIRMED
}
```

### 5. QR Confirm Request DTO
```java
public class QrConfirmRequest {
    private String loginToken;        // Token từ QR code
}
```

## 🛡️ Bảo mật

### 1. Token Security
- ✅ LoginToken là UUID v4 (128-bit random)
- ✅ TTL ngắn: 2 phút
- ✅ Single-use: Sau khi confirm thì delete khỏi Redis
- ✅ Rate limiting trên polling endpoint

### 2. Mobile Authentication
- ✅ Mobile app phải có valid JWT token
- ✅ Chỉ user đã đăng nhập trên mobile mới quét được
- ✅ Verify userId từ mobile token

### 3. CSRF Protection
- ✅ LoginToken chỉ dùng 1 lần
- ✅ Không thể replay attack vì token bị xóa sau confirm

### 4. Man-in-the-Middle Protection
- ✅ HTTPS required trong production
- ✅ Token ngắn hạn (2 phút)

## 🎨 Frontend Integration

### 1. Login Page
```typescript
// Step 1: Submit username/password
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ usernameOrEmail, password })
});

const { loginToken, qrCodeDataUrl, expiresIn } = await loginResponse.json();

// Step 2: Display QR Code
<img src={qrCodeDataUrl} alt="QR Code" />
<p>Quét mã QR để đăng nhập</p>
<Countdown seconds={expiresIn} />

// Step 3: Start polling
const pollInterval = setInterval(async () => {
  const statusResponse = await fetch(`/api/auth/qr-status?token=${loginToken}`);
  const { status, accessToken, refreshToken } = await statusResponse.json();
  
  if (status === 'CONFIRMED') {
    clearInterval(pollInterval);
    // Save tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Redirect to dashboard
    navigate('/dashboard');
  } else if (status === 'EXPIRED') {
    clearInterval(pollInterval);
    // Show error: "Mã QR đã hết hạn"
  }
}, 2000); // Poll mỗi 2 giây
```

### 2. Mobile App (React Native / Flutter)
```typescript
// Scan QR Code
const { data } = await BarCodeScanner.scanAsync();
const loginToken = data; // Extract token from QR

// Confirm login
const response = await fetch('/api/auth/qr-confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${mobileAccessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ loginToken })
});

if (response.ok) {
  Alert.alert('Thành công', 'Đăng nhập thành công trên web!');
}
```

## 📊 Sequence Diagram

```
┌────────┐         ┌─────────┐         ┌────────┐         ┌──────┐
│Browser │         │ Backend │         │ Redis  │         │Mobile│
└────┬───┘         └────┬────┘         └───┬────┘         └──┬───┘
     │                  │                   │                 │
     │ POST /login      │                   │                 │
     │ {user,pass}      │                   │                 │
     ├─────────────────>│                   │                 │
     │                  │                   │                 │
     │                  │ Generate Token    │                 │
     │                  │ Store PENDING     │                 │
     │                  ├──────────────────>│                 │
     │                  │                   │                 │
     │ QR Code + Token  │                   │                 │
     │<─────────────────┤                   │                 │
     │                  │                   │                 │
     │ Poll: GET /qr-status                 │                 │
     ├─────────────────>│                   │                 │
     │                  │ Check Status      │                 │
     │                  ├──────────────────>│                 │
     │                  │ Status: PENDING   │                 │
     │ {PENDING}        │<──────────────────┤                 │
     │<─────────────────┤                   │                 │
     │                  │                   │                 │
     │                  │                   │ Scan QR         │
     │                  │                   │<────────────────┤
     │                  │                   │                 │
     │                  │ POST /qr-confirm  │                 │
     │                  │<──────────────────┼─────────────────┤
     │                  │                   │                 │
     │                  │ Update CONFIRMED  │                 │
     │                  ├──────────────────>│                 │
     │                  │                   │                 │
     │                  │ Success           │                 │
     │                  ├──────────────────>┼─────────────────>
     │                  │                   │                 │
     │ Poll: GET /qr-status                 │                 │
     ├─────────────────>│                   │                 │
     │                  │ Check Status      │                 │
     │                  ├──────────────────>│                 │
     │                  │ Status: CONFIRMED │                 │
     │                  │ + JWT tokens      │                 │
     │ {CONFIRMED       │<──────────────────┤                 │
     │  +tokens}        │                   │                 │
     │<─────────────────┤                   │                 │
     │                  │                   │                 │
     │ Navigate to      │                   │                 │
     │ Dashboard        │                   │                 │
     │                  │                   │                 │
```

## 🚀 API Endpoints

### 1. POST /api/auth/qr-login
**Mô tả**: Tạo QR code để đăng nhập

**Request**:
```json
{
  "usernameOrEmail": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "loginToken": "a1b2c3d4-e5f6-4789-a012-3456789abcdef",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "expiresIn": 120,
    "instruction": "Quét mã QR bằng ứng dụng di động để đăng nhập"
  },
  "message": "Vui lòng quét mã QR"
}
```

### 2. GET /api/auth/qr-status
**Mô tả**: Kiểm tra trạng thái QR login (polling)

**Query Params**: `?token={loginToken}`

**Response (PENDING)**:
```json
{
  "success": true,
  "data": {
    "status": "PENDING"
  }
}
```

**Response (CONFIRMED)**:
```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED",
    "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
    "refreshToken": "uuid-v4",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  },
  "message": "Đăng nhập thành công"
}
```

**Response (EXPIRED)**:
```json
{
  "success": false,
  "message": "Mã QR đã hết hạn"
}
```

### 3. POST /api/auth/qr-confirm
**Mô tả**: Xác nhận đăng nhập từ mobile app

**Headers**: `Authorization: Bearer {mobileToken}`

**Request**:
```json
{
  "loginToken": "a1b2c3d4-e5f6-4789-a012-3456789abcdef"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Xác nhận đăng nhập thành công"
}
```

## 📝 Implementation Tasks

### Backend
- [ ] Tạo `QrLoginRequest` DTO
- [ ] Tạo `QrLoginResponse` DTO
- [ ] Tạo `QrStatusResponse` DTO
- [ ] Tạo `QrConfirmRequest` DTO
- [ ] Implement `POST /api/auth/qr-login` endpoint
- [ ] Implement `GET /api/auth/qr-status` endpoint
- [ ] Implement `POST /api/auth/qr-confirm` endpoint
- [ ] Tạo QR code với thư viện ZXing
- [ ] Redis service để lưu login token
- [ ] Rate limiting cho polling endpoint

### Frontend
- [ ] UI hiển thị QR code
- [ ] Countdown timer (2 phút)
- [ ] Polling logic (mỗi 2 giây)
- [ ] Handle CONFIRMED status
- [ ] Handle EXPIRED status
- [ ] Loading states
- [ ] Error handling

### Mobile App (Future)
- [ ] QR code scanner
- [ ] API call để confirm
- [ ] Success notification

## 🎯 Ưu điểm của QR Login

1. **Tiện lợi**: Không cần nhập OTP
2. **An toàn**: Token chỉ tồn tại 2 phút, dùng 1 lần
3. **User Experience**: Trải nghiệm mượt mà như WhatsApp Web
4. **Cross-device**: Đồng bộ giữa web và mobile
5. **No email required**: Không cần email để gửi OTP

## ⚠️ Lưu ý

1. Cần có **mobile app** để quét QR (hoặc dùng camera phone + web page)
2. User phải **đã đăng nhập** trên mobile app
3. Cần **HTTPS** trong production
4. Backend cần **Redis** để lưu temporary token
