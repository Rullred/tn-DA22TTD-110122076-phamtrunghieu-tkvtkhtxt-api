package com.enterprise.studentmanagement.iam.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

/**
 * Service to handle sending emails, specifically OTP codes
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send an OTP code to user's email asynchronously to avoid blocking the login response
     */
    @Async("taskExecutor")
    public void sendOtpEmail(String toEmail, String fullName, String otpCode) {
        log.info("Sending OTP email to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "CET SmartPortal");
            helper.setTo(toEmail);
            helper.setSubject("CET SmartPortal - Mã xác thực đăng nhập (OTP)");

            String htmlContent = buildOtpTemplate(fullName, otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email successfully sent to: {}", toEmail);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Builds a beautifully designed responsive HTML email template for OTP validation
     */
    private String buildOtpTemplate(String fullName, String otpCode) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='UTF-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }" +
                "        .container { max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); overflow: hidden; }" +
                "        .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #f59e0b; }" +
                "        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }" +
                "        .header p { color: #f59e0b; margin: 4px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }" +
                "        .content { padding: 40px 32px; }" +
                "        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px; }" +
                "        .lead { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }" +
                "        .otp-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1; }" +
                "        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; padding-left: 8px; }" +
                "        .expiry-text { font-size: 12px; font-weight: 600; color: #dc2626; margin: 8px 0 0 0; text-align: center; }" +
                "        .divider { height: 1px; background-color: #e2e8f0; margin: 32px 0; }" +
                "        .footer { padding: 0 32px 32px 32px; font-size: 12px; line-height: 1.5; color: #64748b; }" +
                "        .footer p { margin: 4px 0; }" +
                "        .footer-note { font-style: italic; color: #94a3b8; margin-top: 16px !important; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>Cổng thông tin CET SmartPortal</h1>" +
                "            <p>Khoa Kỹ thuật & Công nghệ - ĐH Trà Vinh</p>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <p class='greeting'>Kính gửi " + fullName + ",</p>" +
                "            <p class='lead'>Bạn đang thực hiện đăng nhập vào hệ thống quản lý học tập. Vui lòng sử dụng mã xác thực một lần (OTP) dưới đây để hoàn tất quá trình xác minh danh tính:</p>" +
                "            <div class='otp-box'>" +
                "                <h2 class='otp-code'>" + otpCode + "</h2>" +
                "                <p class='expiry-text'>Mã OTP này có hiệu lực trong vòng 5 phút.</p>" +
                "            </div>" +
                "            <p class='lead'>Nếu không phải bạn yêu cầu đăng nhập này, vui lòng bỏ qua email này hoặc liên hệ ngay với ban quản trị hệ thống để bảo vệ tài khoản.</p>" +
                "            <div class='divider'></div>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            <p>Trân trọng,</p>" +
                "            <p><strong>Hệ thống quản lý SmartPortal</strong></p>" +
                "            <p>Trường Kỹ thuật và Công nghệ - Đại học Trà Vinh</p>" +
                "            <p class='footer-note'>* Đây là email tự động từ hệ thống, vui lòng không trả lời thư này.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}
