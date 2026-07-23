# Triển khai TOTP (Google Authenticator) cho Xác thực 2 yếu tố

## Tổng quan
Hệ thống đã được cập nhật với tính năng TOTP (Time-based One-Time Password) để tăng cường bảo mật cho tài khoản người dùng. Thay vì sử dụng OTP qua email (gặp vấn đề với Gmail SMTP), giờ đây người dùng có thể sử dụng ứng dụng Google Authenticator trên điện thoại để tạo mã xác thực.

## Lợi ích của TOTP so với Email OTP
- ✅ **Độ tin cậy cao**: Không phụ thuộc vào dịch vụ email
- ✅ **Bảo mật mạnh**: Mã được tạo offline trên thiết bị của người dùng
- ✅ **Chuyên nghiệp**: Được sử dụng rộng rãi bởi Google, GitHub, AWS, v.v.
- ✅ **Nhanh chóng**: Mã được tạo ngay lập tức, không cần chờ email

## Các Endpoint API mới

### 1. Setup TOTP (Khởi tạo TOTP)
**Endpoint**: `POST /api/auth/totp/setup`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "manualEntryKey": "JBSW-Y3DP-EHPK-3PXP"
}
```

**Mô tả**: 
- Tạo secret key mới cho người dùng
- Trả về mã QR để quét bằng Google Authenticator
- Trả về manual entry key để nhập thủ công nếu không quét được QR

### 2. Enable TOTP (Kích hoạt TOTP)
**Endpoint**: `POST /api/auth/totp/enable`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "code": "123456"
}
```

**Response**:
```json
{
  "message": "TOTP đã được kích hoạt thành công"
}
```

**Mô tả**: 
- Xác nhận mã TOTP từ Google Authenticator
- Kích hoạt TOTP cho tài khoản nếu mã đúng

### 3. Disable TOTP (Tắt TOTP)
**Endpoint**: `POST /api/auth/totp/disable`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "code": "123456"
}
```

**Response**:
```json
{
  "message": "TOTP đã được tắt"
}
```

**Mô tả**: Tắt TOTP cho tài khoản (cần xác nhận bằng mã TOTP hiện tại)

### 4. Verify TOTP (Xác minh TOTP khi đăng nhập)
**Endpoint**: `POST /api/auth/totp/verify`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "email": "admin@tvu.edu.vn",
  "code": "123456"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Mô tả**: Xác minh mã TOTP sau khi đăng nhập thành công

## Thay đổi trong Login Flow

### Trước đây (Email OTP):
1. User nhập username/password
2. Hệ thống gửi OTP qua email
3. User nhập OTP từ email
4. Hệ thống xác thực và trả về token

### Hiện tại (TOTP):
1. User nhập username/password
2. Nếu user đã bật TOTP:
   - Hệ thống trả về: `"message": "Vui lòng nhập mã TOTP từ Google Authenticator"`
   - User mở Google Authenticator trên điện thoại
   - User nhập mã 6 số từ app
   - Call endpoint `/api/auth/totp/verify` với email và code
   - Hệ thống xác thực và trả về token
3. Nếu user chưa bật TOTP:
   - Hệ thống trả về token ngay lập tức

## Hướng dẫn Test với Admin Account

### Bước 1: Đăng nhập với tài khoản admin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phamtrunghieudhi1301@gmail.com",
    "password": "admin123"
  }'
```

**Response**: Bạn sẽ nhận được access token

### Bước 2: Setup TOTP
```bash
curl -X POST http://localhost:8080/api/auth/totp/setup \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response**: Bạn sẽ nhận được:
- QR Code (dạng base64 data URL)
- Secret key để nhập thủ công

### Bước 3: Quét QR Code bằng Google Authenticator
1. Tải ứng dụng **Google Authenticator** từ:
   - iOS: App Store
   - Android: Google Play Store
2. Mở app và chọn "+" để thêm tài khoản mới
3. Chọn "Quét mã QR" hoặc "Nhập khóa thiết lập"
4. Nếu quét QR: Quét mã QR từ response
5. Nếu nhập thủ công: Nhập `manualEntryKey` từ response

### Bước 4: Enable TOTP
Lấy mã 6 số từ Google Authenticator và gọi:
```bash
curl -X POST http://localhost:8080/api/auth/totp/enable \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

### Bước 5: Test đăng nhập với TOTP
1. Đăng nhập lại:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phamtrunghieudhi1301@gmail.com",
    "password": "admin123"
  }'
```

**Response**: `"Vui lòng nhập mã TOTP từ Google Authenticator"`

2. Verify TOTP:
```bash
curl -X POST http://localhost:8080/api/auth/totp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phamtrunghieudhi1301@gmail.com",
    "code": "123456"
  }'
```

**Response**: Access token và refresh token

## Cấu trúc Database

### Migration V3: TOTP Support
Đã thêm 2 cột vào bảng `users`:
- `totp_secret`: Lưu secret key TOTP (nullable)
- `totp_enabled`: Boolean flag để kiểm tra xem user đã bật TOTP chưa

## Files đã thay đổi/tạo mới

### 1. Dependencies (pom.xml)
- `dev.samstevens.totp:totp:1.7.1` - Thư viện TOTP
- `com.google.zxing:core:3.5.3` - Thư viện tạo QR code
- `com.google.zxing:javase:3.5.3` - Java SE support cho ZXing

### 2. Database Migration
- `V3__add_totp_support.sql` - Thêm cột TOTP vào bảng users

### 3. Entity
- `User.java` - Thêm fields `totpSecret` và `totpEnabled`

### 4. Service Layer
- `TotpService.java` - Service xử lý TOTP logic:
  - `generateSecret()`: Tạo secret key mới
  - `generateQrCodeDataUrl()`: Tạo QR code
  - `verifyCode()`: Xác minh mã TOTP
  - `getCurrentCode()`: Lấy mã hiện tại (dùng cho testing)

### 5. DTOs
- `TotpSetupResponse.java` - Response cho setup endpoint
- `TotpVerifyRequest.java` - Request cho verify endpoint

### 6. Controller
- `TotpController.java` - REST endpoints cho TOTP operations
- `AuthenticationService.java` - Updated login flow để check TOTP

### 7. Legacy Code
- `AuthController.verifyOtp()` - Đánh dấu @Deprecated (giữ lại để backward compatibility)

## Tính năng bảo mật

1. **Time-based**: Mã OTP thay đổi mỗi 30 giây
2. **6 digits**: Mã gồm 6 chữ số
3. **SHA1 Algorithm**: Sử dụng thuật toán băm SHA1
4. **Secret Protection**: Secret key được lưu an toàn trong database
5. **Verification Required**: Phải xác minh mã trước khi enable TOTP

## Lưu ý cho Frontend Integration

Frontend cần hiển thị:
1. **QR Code Image**: Hiển thị image từ `qrCodeDataUrl` (base64 data URL)
2. **Manual Entry Key**: Hiển thị `manualEntryKey` để user có thể nhập thủ công
3. **Input Field**: Input 6 chữ số để nhập mã từ Google Authenticator
4. **Enable/Disable Toggle**: Nút để bật/tắt TOTP
5. **TOTP Status**: Hiển thị trạng thái TOTP đã bật hay chưa

## Testing Checklist

- [ ] Setup TOTP và quét QR code thành công
- [ ] Enable TOTP với mã đúng
- [ ] Enable TOTP với mã sai (should fail)
- [ ] Đăng nhập với TOTP enabled
- [ ] Verify TOTP với mã đúng
- [ ] Verify TOTP với mã sai (should fail)
- [ ] Disable TOTP
- [ ] Đăng nhập sau khi disable TOTP (không yêu cầu mã)

## Tài khoản Admin hiện tại

```
Email: phamtrunghieudhi1301@gmail.com
Password: admin123
TOTP Status: Chưa được kích hoạt (cần setup)
```

## Liên hệ

Nếu có vấn đề với TOTP implementation, vui lòng kiểm tra:
1. Đồng hồ hệ thống server có chính xác không (TOTP phụ thuộc vào thời gian)
2. Google Authenticator app có được cài đặt đúng không
3. Mã có còn hiệu lực không (30 giây)
4. Logs của iam-service để xem lỗi chi tiết
