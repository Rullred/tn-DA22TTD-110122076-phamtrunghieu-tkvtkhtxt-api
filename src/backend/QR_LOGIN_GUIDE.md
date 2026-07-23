# Hướng dẫn sử dụng QR Code Login

## 🎯 Tổng quan
Hệ thống QR Code Login cho phép người dùng đăng nhập bằng cách quét mã QR với camera điện thoại, thay vì nhập mã OTP.

## ✨ Ưu điểm
- ✅ **Tiện lợi**: Không cần nhập mã OTP 6 số
- ✅ **Nhanh chóng**: Chỉ cần quét QR và nhấn xác nhận
- ✅ **An toàn**: Mã QR chỉ có hiệu lực 2 phút
- ✅ **Không cần app**: Chỉ cần camera điện thoại
- ✅ **Trải nghiệm tốt**: Giống WhatsApp Web, Telegram Web

## 📱 Flow hoạt động

### Bước 1: Người dùng đăng nhập trên web
```
1. Mở trang login: http://localhost:5173/login
2. Nhập username: admin
3. Nhập password: admin123
4. Nhấn nút "Đăng nhập bằng QR Code"
```

### Bước 2: Hệ thống hiển thị QR Code
```
1. Backend tạo mã QR chứa link xác nhận
2. Frontend hiển thị:
   - Mã QR (300x300px)
   - Countdown timer (120 giây)
   - Hướng dẫn: "Quét mã QR bằng camera điện thoại"
3. Frontend bắt đầu polling (mỗi 2 giây) để kiểm tra status
```

### Bước 3: Người dùng quét QR bằng điện thoại
```
1. Mở camera trên điện thoại (iPhone/Android)
2. Quét mã QR
3. Điện thoại tự động mở link trong trình duyệt:
   http://localhost:5173/auth/qr-confirm?token=abc-123-xyz
4. Trang xác nhận hiển thị "Đăng nhập thành công! ✅"
```

### Bước 4: Web tự động đăng nhập
```
1. Frontend đang polling phát hiện status = "CONFIRMED"
2. Frontend nhận được accessToken và refreshToken
3. Lưu tokens vào localStorage
4. Redirect đến dashboard
5. Hoàn tất! ✅
```

## 🔧 API Endpoints

### 1. POST /api/auth/qr-login
**Mô tả**: Tạo mã QR để đăng nhập

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
    "confirmationLink": "http://localhost:5173/auth/qr-confirm?token=a1b2c3d4-e5f6-4789-a012-3456789abcdef",
    "expiresIn": 120,
    "instruction": "Quét mã QR bằng camera điện thoại để đăng nhập"
  },
  "message": "Vui lòng quét mã QR để đăng nhập"
}
```

### 2. GET /api/auth/qr-status?token={loginToken}
**Mô tả**: Kiểm tra trạng thái QR (polling mỗi 2 giây)

**Response (PENDING)**:
```json
{
  "success": true,
  "data": {
    "status": "PENDING"
  },
  "message": "Đang chờ xác nhận"
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
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "phamtrunghieudhi1301@gmail.com",
      "role": "ADMIN",
      "isLocked": false,
      "lastLoginAt": "2026-07-03T10:45:00",
      "createdAt": "2026-06-24T02:39:32"
    }
  },
  "message": "Đăng nhập thành công"
}
```

**Response (EXPIRED)**:
```json
{
  "success": true,
  "data": {
    "status": "EXPIRED"
  },
  "message": "Mã QR đã hết hạn"
}
```

### 3. GET /api/auth/qr-confirm?token={loginToken}
**Mô tả**: Xác nhận đăng nhập (được gọi khi quét QR)

**Response (SUCCESS)**: HTML page
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Xác nhận đăng nhập thành công</title>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Đăng nhập thành công!</h1>
        <p>Bạn đã xác nhận đăng nhập thành công.</p>
        <p>Vui lòng quay lại trình duyệt trên máy tính để tiếp tục.</p>
    </div>
</body>
</html>
```

**Response (ERROR)**: HTML page
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Lỗi xác nhận</title>
</head>
<body>
    <div class="container">
        <div class="icon">❌</div>
        <h1>Mã QR không hợp lệ</h1>
        <p>Mã QR đã hết hạn hoặc không hợp lệ</p>
    </div>
</body>
</html>
```

## 💻 Frontend Implementation

### React/Vue/Angular Example:
```typescript
// Step 1: Call API to generate QR
const handleQrLogin = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/qr-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: username,
        password: password
      })
    });
    
    const result = await response.json();
    const { loginToken, qrCodeDataUrl, expiresIn } = result.data;
    
    // Step 2: Display QR Code
    setQrCode(qrCodeDataUrl);
    setLoginToken(loginToken);
    startCountdown(expiresIn);
    
    // Step 3: Start polling
    startPolling(loginToken);
    
  } catch (error) {
    console.error('QR Login error:', error);
  }
};

// Polling function
const startPolling = (token: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/qr-status?token=${token}`
      );
      
      const result = await response.json();
      const { status, accessToken, refreshToken, user } = result.data;
      
      if (status === 'CONFIRMED') {
        // Success! Save tokens and redirect
        clearInterval(pollInterval);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
        
      } else if (status === 'EXPIRED') {
        // QR code expired
        clearInterval(pollInterval);
        alert('Mã QR đã hết hạn. Vui lòng thử lại.');
        
      }
      // If PENDING, keep polling
      
    } catch (error) {
      clearInterval(pollInterval);
      console.error('Polling error:', error);
    }
  }, 2000); // Poll every 2 seconds
  
  // Cleanup after 2 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
  }, 120000);
};

// Countdown timer
const startCountdown = (seconds: number) => {
  setTimeLeft(seconds);
  
  const countdownInterval = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(countdownInterval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};

// JSX
<div>
  {qrCode && (
    <div className="qr-login-container">
      <h2>Quét mã QR để đăng nhập</h2>
      <img src={qrCode} alt="QR Code" className="qr-code" />
      <p className="countdown">Mã có hiệu lực trong {timeLeft} giây</p>
      <p className="instruction">
        1. Mở camera trên điện thoại<br/>
        2. Quét mã QR<br/>
        3. Nhấn xác nhận trên điện thoại
      </p>
    </div>
  )}
</div>
```

### CSS Styling:
```css
.qr-login-container {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.qr-code {
  width: 300px;
  height: 300px;
  margin: 20px auto;
  border: 4px solid #667eea;
  border-radius: 10px;
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.countdown {
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
  margin: 16px 0;
}

.instruction {
  color: #718096;
  font-size: 14px;
  line-height: 1.8;
  margin-top: 20px;
}
```

## 🧪 Testing

### Test với curl:

#### 1. Generate QR Code:
```bash
curl -X POST http://localhost:8080/api/auth/qr-login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "admin123"
  }'
```

#### 2. Check Status (Polling):
```bash
# Thay TOKEN bằng loginToken từ response trên
curl http://localhost:8080/api/auth/qr-status?token=TOKEN
```

#### 3. Confirm (Simulate phone):
```bash
# Mở link này trong trình duyệt
http://localhost:8080/api/auth/qr-confirm?token=TOKEN
```

#### 4. Check Status Again:
```bash
curl http://localhost:8080/api/auth/qr-status?token=TOKEN
# Sẽ trả về CONFIRMED với accessToken
```

## 🔒 Bảo mật

1. **Token Security**:
   - LoginToken là UUID v4 (128-bit random)
   - TTL ngắn: 2 phút
   - Single-use: Sau khi confirm thì bị xóa
   - Lưu trong Redis (in-memory, nhanh)

2. **Rate Limiting**:
   - Giới hạn số request tạo QR: 5 requests/phút/IP
   - Giới hạn polling: 60 requests/phút/IP

3. **Account Protection**:
   - Vẫn check account lock trước khi tạo QR
   - Vẫn check IP blacklist
   - Log tất cả activities

4. **CSRF Protection**:
   - Token chỉ dùng 1 lần
   - Không thể replay attack

## 📊 Redis Data Structure

```
Key: qr:login:a1b2c3d4-e5f6-4789-a012-3456789abcdef
Value: "uuid:admin:PENDING"
TTL: 120 seconds

After confirm:
Value: "uuid:admin:CONFIRMED"
TTL: 120 seconds (keep same TTL)

After polling gets CONFIRMED:
Key is deleted (single use)
```

## 🎨 UI/UX Best Practices

1. **QR Code Display**:
   - Kích thước: 300x300px
   - Border màu brand color
   - Animation khi hiển thị
   - Countdown timer rõ ràng

2. **Loading States**:
   - Skeleton loading khi đang tạo QR
   - Polling indicator nhỏ gọn
   - Smooth transition khi confirmed

3. **Error Handling**:
   - QR expired: Cho phép tạo lại ngay
   - Network error: Retry button
   - Invalid credentials: Clear message

4. **Mobile Experience**:
   - Confirmation page responsive
   - Large success/error icons
   - Clear instructions

## 🚀 Deployment Notes

### Environment Variables:
```bash
# Backend (.env)
FRONTEND_URL=https://yourdomain.com

# Or in docker-compose.yml
environment:
  - FRONTEND_URL=https://yourdomain.com
```

### Production Considerations:
- ✅ Use HTTPS in production
- ✅ Set proper CORS for frontend domain
- ✅ Configure Redis persistence
- ✅ Monitor QR generation rate
- ✅ Set up rate limiting
- ✅ Enable security logging

## 📈 Future Enhancements

1. **Mobile App Integration**:
   - Native app có thể scan và confirm trực tiếp
   - Push notification khi có login attempt

2. **Multiple Device Support**:
   - Cho phép login nhiều device cùng lúc
   - Device management page

3. **Biometric Verification**:
   - Yêu cầu Face ID/Touch ID trước khi confirm
   - Thêm layer bảo mật

4. **Analytics**:
   - Track QR login success rate
   - Monitor average confirmation time
   - Device statistics

## ❓ FAQ

**Q: QR code hết hạn sau bao lâu?**
A: 2 phút (120 giây). Sau đó user phải tạo QR mới.

**Q: Có cần cài app gì không?**
A: Không! Chỉ cần camera điện thoại để quét QR.

**Q: An toàn không?**
A: Có! Token chỉ dùng 1 lần, hết hạn sau 2 phút, và được lưu trong Redis (in-memory).

**Q: Có thể dùng trên mọi điện thoại?**
A: Có! Bất kỳ điện thoại nào có camera và trình duyệt web đều dùng được.

**Q: Nếu quét QR nhưng không confirm thì sao?**
A: QR sẽ tự hết hạn sau 2 phút. User phải tạo QR mới.

**Q: Có thể tắt tính năng OTP cũ không?**
A: Có thể giữ cả 2: QR Login và OTP Login. User chọn cách nào họ muốn.
