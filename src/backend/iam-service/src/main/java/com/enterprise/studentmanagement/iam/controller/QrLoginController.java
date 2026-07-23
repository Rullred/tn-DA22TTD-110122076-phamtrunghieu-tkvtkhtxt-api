package com.enterprise.studentmanagement.iam.controller;

import com.enterprise.studentmanagement.iam.dto.ApiResponse;
import com.enterprise.studentmanagement.iam.dto.QrLoginRequest;
import com.enterprise.studentmanagement.iam.dto.QrLoginResponse;
import com.enterprise.studentmanagement.iam.dto.QrStatusResponse;
import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.exception.BadRequestException;
import com.enterprise.studentmanagement.iam.exception.UnauthorizedException;
import com.enterprise.studentmanagement.iam.repository.UserRepository;
import com.enterprise.studentmanagement.iam.service.QrLoginService;
import com.enterprise.studentmanagement.iam.util.IpAddressUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for QR Code Login
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "QR Login", description = "QR Code Login endpoints")
public class QrLoginController {

    private final QrLoginService qrLoginService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Step 1: Generate QR code for login
     * User submits username/password and receives QR code
     */
    @PostMapping("/qr-login")
    @Operation(summary = "Generate QR Code for Login", description = "Submit credentials and get QR code to scan")
    public ResponseEntity<ApiResponse<QrLoginResponse>> generateQrLogin(
            @Valid @RequestBody QrLoginRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        log.info("QR login request from IP: {}, user: {}", clientIp, request.getUsernameOrEmail());

        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail())
                .orElseThrow(() -> new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không đúng"));

        // Check if account is locked
        if (user.getIsLocked() != null && user.getIsLocked()) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Failed login attempt for user: {} from IP: {}", request.getUsernameOrEmail(), clientIp);
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        // Generate QR code
        QrLoginResponse qrResponse = qrLoginService.generateQrLogin(
                user.getId().toString(),
                user.getUsername()
        );

        log.info("QR login generated for user: {}", user.getUsername());
        
        return ResponseEntity.ok(ApiResponse.success(qrResponse, "Vui lòng quét mã QR để đăng nhập"));
    }

    /**
     * Step 2: Check QR login status (polling from browser)
     * Browser polls this endpoint every 2 seconds to check if user confirmed on phone
     */
    @GetMapping("/qr-status")
    @Operation(summary = "Check QR Login Status", description = "Poll this endpoint to check if QR was scanned")
    public ResponseEntity<ApiResponse<QrStatusResponse>> checkQrStatus(
            @RequestParam String token) {
        
        log.debug("Checking QR login status for token: {}", token);
        
        QrStatusResponse status = qrLoginService.checkQrStatus(token);
        
        if ("CONFIRMED".equals(status.getStatus())) {
            return ResponseEntity.ok(ApiResponse.success(status, "Đăng nhập thành công"));
        } else if ("EXPIRED".equals(status.getStatus())) {
            return ResponseEntity.ok(ApiResponse.success(status, "Mã QR đã hết hạn"));
        } else {
            return ResponseEntity.ok(ApiResponse.success(status, "Đang chờ xác nhận"));
        }
    }

    /**
     * Step 3 (GET): Show the confirmation login page on the phone.
     * When the user scans the QR, the phone opens this page. Instead of auto
     * confirming, we render a login form so the person MUST authenticate with
     * the registered Gmail + password before the login on the PC is confirmed.
     */
    @GetMapping("/qr-confirm")
    @Operation(summary = "QR Confirm Page", description = "Login page shown on the phone after scanning the QR")
    public ResponseEntity<String> qrConfirmPage(@RequestParam String token) {
        return htmlResponse(renderLoginForm(token, null));
    }

    /**
     * Step 3 (POST): Verify the credentials entered on the phone.
     * The account must match the one that started the login on the computer.
     */
    @PostMapping("/qr-confirm")
    @Operation(summary = "Confirm QR Login", description = "Submit credentials on phone to confirm login")
    public ResponseEntity<String> confirmQrLogin(
            @RequestParam String token,
            @RequestParam(required = false) String usernameOrEmail,
            @RequestParam(required = false) String password,
            HttpServletRequest httpRequest) {

        String clientIp = IpAddressUtil.getClientIp(httpRequest);
        log.info("QR login confirmation attempt from IP: {}, token: {}", clientIp, token);

        try {
            String username = qrLoginService.confirmQrLoginWithCredentials(token, usernameOrEmail, password);
            return htmlResponse(renderSuccess(username));
        } catch (BadRequestException e) {
            // Re-render the form with the error so the user can retry on the phone
            return htmlResponse(renderLoginForm(token, e.getMessage()));
        }
    }

    // ---------------------------------------------------------------------
    // HTML rendering helpers (self-contained, mobile-first)
    // ---------------------------------------------------------------------

    private ResponseEntity<String> htmlResponse(String html) {
        return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(html);
    }

    private String renderLoginForm(String token, String errorMessage) {
        String safeToken = htmlEscape(token);
        String errorBlock = (errorMessage == null || errorMessage.isBlank()) ? "" :
                "<div class=\"alert\">" + htmlEscape(errorMessage) + "</div>";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác nhận đăng nhập</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #1e293b 0%, #312e81 60%, #1e3a8a 100%);
                        min-height: 100vh; display: flex; align-items: center;
                        justify-content: center; padding: 20px;
                    }
                    .card {
                        background: #fff; width: 100%; max-width: 400px;
                        padding: 32px 26px; border-radius: 24px;
                        box-shadow: 0 20px 60px rgba(0,0,0,.35); animation: up .4s ease-out;
                    }
                    @keyframes up { from { opacity:0; transform:translateY(24px);} to {opacity:1; transform:none;} }
                    .badge {
                        width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 18px;
                        background: linear-gradient(135deg,#2563eb,#4f46e5);
                        display:flex; align-items:center; justify-content:center; font-size:30px;
                    }
                    h1 { color:#0f172a; font-size:22px; text-align:center; margin-bottom:6px; }
                    .sub { color:#64748b; font-size:13px; text-align:center; line-height:1.5; margin-bottom:22px; }
                    label { display:block; font-size:11px; font-weight:800; letter-spacing:.5px;
                            text-transform:uppercase; color:#475569; margin:14px 0 6px; }
                    input {
                        width:100%; padding:13px 14px; border:1px solid #e2e8f0; border-radius:12px;
                        font-size:15px; background:#f8fafc; transition:.2s; color:#0f172a;
                    }
                    input:focus { outline:none; border-color:#2563eb; background:#fff;
                                  box-shadow:0 0 0 3px rgba(37,99,235,.15); }
                    button {
                        width:100%; margin-top:22px; padding:14px; border:none; border-radius:12px;
                        background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff;
                        font-size:15px; font-weight:700; cursor:pointer; transition:.2s;
                    }
                    button:active { transform:scale(.99); }
                    .alert {
                        background:#fef2f2; border:1px solid #fecaca; color:#b91c1c;
                        padding:11px 14px; border-radius:12px; font-size:13px;
                        line-height:1.5; margin-bottom:18px;
                    }
                    .foot { margin-top:18px; text-align:center; color:#94a3b8; font-size:11px; line-height:1.5; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">&#128273;</div>
                    <h1>Xác nhận đăng nhập</h1>
                    <p class="sub">Đăng nhập bằng đúng tài khoản đã bắt đầu trên máy tính để hoàn tất.</p>
                    __ERROR__
                    <form method="post" action="/api/auth/qr-confirm">
                        <input type="hidden" name="token" value="__TOKEN__">
                        <label>Email hoặc tên đăng nhập</label>
                        <input type="text" name="usernameOrEmail" placeholder="ten@gmail.com"
                               autocomplete="username" required autofocus>
                        <label>Mật khẩu</label>
                        <input type="password" name="password" placeholder="Nhập mật khẩu"
                               autocomplete="current-password" required>
                        <button type="submit">Xác nhận đăng nhập</button>
                    </form>
                    <p class="foot">Chỉ tài khoản khớp với phiên trên máy tính mới được chấp nhận.<br>Mã QR có hiệu lực trong thời gian giới hạn.</p>
                </div>
            </body>
            </html>
            """
            .replace("__ERROR__", errorBlock)
            .replace("__TOKEN__", safeToken);
    }

    private String renderSuccess(String username) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Đăng nhập thành công</title>
                <style>
                    * { margin:0; padding:0; box-sizing:border-box; }
                    body {
                        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                        background:linear-gradient(135deg,#065f46 0%,#047857 55%,#0f766e 100%);
                        min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px;
                    }
                    .card {
                        background:#fff; max-width:400px; width:100%; padding:40px 30px;
                        border-radius:24px; box-shadow:0 20px 60px rgba(0,0,0,.3); text-align:center;
                        animation:up .5s ease-out;
                    }
                    @keyframes up { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:none;} }
                    .icon { font-size:64px; margin-bottom:16px; animation:pop .6s ease-out; }
                    @keyframes pop { 0%{transform:scale(0);} 50%{transform:scale(1.2);} 100%{transform:scale(1);} }
                    h1 { color:#0f172a; font-size:26px; margin-bottom:10px; }
                    p { color:#64748b; font-size:15px; line-height:1.6; }
                    .info { margin-top:20px; background:#f0fdf4; border:1px solid #bbf7d0;
                            padding:14px; border-radius:12px; color:#166534; font-size:14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">&#9989;</div>
                    <h1>Đăng nhập thành công!</h1>
                    <p>Xin chào <strong>__USER__</strong>, bạn đã xác nhận đăng nhập.</p>
                    <div class="info">Vui lòng quay lại trình duyệt trên máy tính — trang sẽ tự động đăng nhập.</div>
                </div>
            </body>
            </html>
            """
            .replace("__USER__", htmlEscape(username));
    }

    private String htmlEscape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
