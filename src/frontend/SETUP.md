# 🚀 Hướng Dẫn Setup Frontend

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 18.x
- npm >= 9.x hoặc pnpm >= 8.x
- Backend đang chạy tại `http://localhost:8080`

---

## 🔧 Cài Đặt

### Bước 1: Install Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng pnpm (khuyến nghị)
pnpm install
```

### Bước 2: Cấu Hình Environment

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa .env nếu cần
# VITE_API_BASE_URL=http://localhost:8080
```

### Bước 3: Chạy Development Server

```bash
# Sử dụng npm
npm run dev

# Hoặc sử dụng pnpm
pnpm dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## 🏗️ Build cho Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

---

## 📁 Cấu Trúc Dự Án

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   ├── Layout.tsx       # Main layout với sidebar
│   │   ├── Navbar.tsx       # Top navigation bar
│   │   └── Sidebar.tsx      # Side navigation
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── pages/
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   ├── admin/           # Admin pages
│   │   ├── teacher/         # Teacher pages
│   │   └── student/         # Student pages
│   ├── App.tsx
│   └── routes.tsx           # Route configuration
├── services/
│   ├── api.ts               # Axios instance với interceptors
│   ├── authService.ts       # Authentication API calls
│   ├── studentService.ts    # Student API calls (TODO)
│   ├── teacherService.ts    # Teacher API calls (TODO)
│   └── classService.ts      # Class API calls (TODO)
├── types/
│   └── (TODO)               # TypeScript type definitions
├── utils/
│   └── (TODO)               # Utility functions
└── main.tsx                 # Entry point
```

---

## 🔐 Authentication Flow

### 1. Login
```typescript
// POST /api/auth/login
{
  "usernameOrEmail": "testuser",
  "password": "Test@123456"
}

// Response
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "role": "STUDENT"
  }
}
```

### 2. Token Storage
- `accessToken` → localStorage
- `refreshToken` → localStorage
- `user` → localStorage

### 3. Token Refresh
- Tự động refresh khi accessToken hết hạn (401)
- Sử dụng axios interceptor

### 4. Logout
- Gọi API `/api/auth/logout`
- Clear localStorage
- Redirect to `/login`

---

## 🎨 UI Components

### Shadcn UI
Dự án sử dụng [Shadcn UI](https://ui.shadcn.com/) - một bộ components đẹp và dễ customize.

**Các components đã có:**
- Button, Input, Select, Checkbox
- Dialog, Alert, Toast
- Table, Card, Badge
- Dropdown, Popover, Tooltip
- và nhiều hơn nữa...

### Tailwind CSS
Styling sử dụng [Tailwind CSS](https://tailwindcss.com/)

**Màu chủ đạo:**
- Primary: Blue (#2563eb)
- Success: Green
- Warning: Orange
- Error: Red

---

## 🧪 Testing

### Test Accounts (Mock)
```
Admin:
- Email: admin@school.com
- Password: bất kỳ

Teacher:
- Email: teacher@school.com
- Password: bất kỳ

Student:
- Email: student@school.com
- Password: bất kỳ
```

### Test với Real Backend
```
1. Đảm bảo backend đang chạy tại http://localhost:8080
2. Register tài khoản mới qua UI
3. Login với tài khoản vừa tạo
4. Test các chức năng CRUD
```

---

## 🐛 Troubleshooting

### Lỗi CORS
Nếu gặp lỗi CORS, kiểm tra backend đã enable CORS chưa:

```java
// Backend: WebConfig.java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("*")
            .allowedHeaders("*")
            .allowCredentials(true);
}
```

### Lỗi 401 Unauthorized
- Kiểm tra token có được lưu đúng không
- Kiểm tra token có hết hạn không
- Kiểm tra backend có nhận được token không

### Lỗi Connection Refused
- Kiểm tra backend có đang chạy không
- Kiểm tra URL trong `.env` có đúng không
- Kiểm tra port có bị conflict không

---

## 📝 TODO List

### Phase 1: Authentication ✅
- [x] Setup API client
- [x] Create authService
- [x] Configure environment variables
- [ ] Update AuthContext với real API
- [ ] Update Login page
- [ ] Update Register page
- [ ] Test authentication flow

### Phase 2: API Integration 🔄
- [ ] Create studentService
- [ ] Create teacherService
- [ ] Create classService
- [ ] Replace mock data in AdminDashboard
- [ ] Replace mock data in Students page
- [ ] Replace mock data in Teachers page
- [ ] Replace mock data in Classes page

### Phase 3: UI/UX 📋
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add toast notifications
- [ ] Add form validation
- [ ] Add confirmation dialogs
- [ ] Improve responsive design

### Phase 4: Testing & Deployment 🚀
- [ ] Test all features
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Build for production
- [ ] Deploy

---

## 🤝 Contributing

1. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
2. Commit changes: `git commit -m "Add: mô tả thay đổi"`
3. Push to branch: `git push origin feature/ten-tinh-nang`
4. Tạo Pull Request

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra console log
2. Kiểm tra network tab
3. Kiểm tra backend logs
4. Liên hệ team

---

**Ngày cập nhật:** 31/05/2026  
**Version:** 1.0.0  
**Status:** 🚧 In Development
