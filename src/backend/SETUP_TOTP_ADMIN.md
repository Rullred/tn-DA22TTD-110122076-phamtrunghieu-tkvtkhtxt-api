# Hướng dẫn Setup TOTP cho Admin

## Bước 1: Đăng nhập và lấy Access Token

### Sử dụng curl (Command Line):
```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"phamtrunghieudhi1301@gmail.com\",\"password\":\"admin123\"}"
```

### Hoặc sử dụng Postman/Thunder Client:
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "phamtrunghieudhi1301@gmail.com",
  "password": "admin123"
}
```

**Response**: Lưu lại `accessToken` từ response

---

## Bước 2: Setup TOTP (Lấy QR Code)

### Sử dụng curl:
```bash
curl -X POST http://localhost:8080/api/auth/totp/setup ^
  -H "Authorization: Bearer <DÁN_ACCESS_TOKEN_VÀO_ĐÂY>"
```

### Hoặc sử dụng Postman/Thunder Client:
```
POST http://localhost:8080/api/auth/totp/setup
Authorization: Bearer <ACCESS_TOKEN>
```

**Response**: Bạn sẽ nhận được:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "manualEntryKey": "JBSW-Y3DP-EHPK-3PXP"
}
```

---

## Bước 3: Hiển thị QR Code

### Cách 1: Hiển thị trong trình duyệt
1. Copy toàn bộ giá trị `qrCodeDataUrl` (bao gồm `data:image/png;base64,...`)
2. Tạo file HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>TOTP QR Code</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        img {
            margin: 20px 0;
            border: 2px solid #4285f4;
            border-radius: 10px;
        }
        .key {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Setup TOTP cho Admin</h1>
        <p>Quét mã QR này bằng Google Authenticator:</p>
        <img src="DÁN_QR_CODE_DATA_URL_VÀO_ĐÂY" alt="TOTP QR Code" />
        <p>Hoặc nhập thủ công:</p>
        <div class="key">DÁN_MANUAL_ENTRY_KEY_VÀO_ĐÂY</div>
        <p><small>Ứng dụng: Google Authenticator<br>Tên tài khoản: CET SmartPortal</small></p>
    </div>
</body>
</html>
```

3. Thay `DÁN_QR_CODE_DATA_URL_VÀO_ĐÂY` bằng giá trị `qrCodeDataUrl`
4. Thay `DÁN_MANUAL_ENTRY_KEY_VÀO_ĐÂY` bằng giá trị `manualEntryKey`
5. Mở file HTML trong trình duyệt

### Cách 2: Sử dụng Frontend hiện tại
Nếu frontend của bạn đã có trang profile/settings, thêm nút "Setup TOTP" và hiển thị QR code từ API response.

---

## Bước 4: Quét QR Code bằng Google Authenticator

1. **Tải Google Authenticator**:
   - iOS: https://apps.apple.com/app/google-authenticator/id388497605
   - Android: https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2

2. **Mở app** và chọn "**+**" (góc dưới bên phải)

3. **Chọn "Quét mã QR"** và quét mã QR từ màn hình

4. **Hoặc chọn "Nhập khóa thiết lập"**:
   - Tên tài khoản: `phamtrunghieudhi1301@gmail.com`
   - Khóa: Dán `manualEntryKey` từ response
   - Loại: Dựa trên thời gian

5. Bạn sẽ thấy mã **6 chữ số** xuất hiện trong app (thay đổi mỗi 30 giây)

---

## Bước 5: Enable TOTP

Lấy mã 6 chữ số từ Google Authenticator và gọi API:

### Sử dụng curl:
```bash
curl -X POST http://localhost:8080/api/auth/totp/enable ^
  -H "Authorization: Bearer <ACCESS_TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"123456\"}"
```

**Thay `123456` bằng mã từ Google Authenticator**

### Hoặc sử dụng Postman/Thunder Client:
```
POST http://localhost:8080/api/auth/totp/enable
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "code": "123456"
}
```

**Response thành công**:
```json
{
  "message": "TOTP đã được kích hoạt thành công"
}
```

---

## Bước 6: Test đăng nhập với TOTP

### 6.1. Đăng xuất và đăng nhập lại:
```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"phamtrunghieudhi1301@gmail.com\",\"password\":\"admin123\"}"
```

**Response**: Bạn sẽ thấy:
```json
{
  "message": "Vui lòng nhập mã TOTP từ Google Authenticator"
}
```

### 6.2. Mở Google Authenticator và lấy mã 6 số

### 6.3. Verify TOTP:
```bash
curl -X POST http://localhost:8080/api/auth/totp/verify ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"phamtrunghieudhi1301@gmail.com\",\"code\":\"123456\"}"
```

**Response thành công**: Bạn sẽ nhận được access token và refresh token
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

## ✅ Hoàn thành!

Từ giờ, mỗi lần đăng nhập vào tài khoản admin, bạn sẽ cần:
1. Nhập email + password
2. Nhập mã 6 số từ Google Authenticator

---

## 🔧 Nếu muốn TẮT TOTP:

```bash
curl -X POST http://localhost:8080/api/auth/totp/disable ^
  -H "Authorization: Bearer <ACCESS_TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"123456\"}"
```

---

## ⚠️ Lưu ý quan trọng:

1. **Lưu giữ Secret Key**: Nếu mất điện thoại, bạn có thể nhập lại `secret` vào Google Authenticator trên thiết bị mới
2. **Backup Codes**: Nên lưu `manualEntryKey` ở nơi an toàn
3. **Thời gian chính xác**: Đảm bảo đồng hồ server và điện thoại chính xác (TOTP dựa trên thời gian)
4. **Mã thay đổi mỗi 30 giây**: Nếu nhập mã quá chậm, lấy mã mới
