package com.enterprise.studentmanagement.iam.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

/**
 * Service for handling TOTP (Time-based One-Time Password) operations
 * Used for Google Authenticator integration
 */
@Service
@Slf4j
public class TotpService {

    private static final String ISSUER = "CET SmartPortal";
    private static final int QR_CODE_SIZE = 300;

    private final DefaultSecretGenerator secretGenerator;
    private final TimeProvider timeProvider;
    private final CodeGenerator codeGenerator;
    private final CodeVerifier codeVerifier;
    private final QrDataFactory qrDataFactory;

    public TotpService() {
        this.secretGenerator = new DefaultSecretGenerator();
        this.timeProvider = new SystemTimeProvider();
        this.codeGenerator = new DefaultCodeGenerator();
        this.codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        // QrDataFactory requires HashingAlgorithm, digits, and period
        this.qrDataFactory = new QrDataFactory(HashingAlgorithm.SHA1, 6, 30);
    }

    /**
     * Generate a new TOTP secret for a user
     */
    public String generateSecret() {
        String secret = secretGenerator.generate();
        log.debug("Generated new TOTP secret");
        return secret;
    }

    /**
     * Generate QR code data URL for setting up TOTP
     * @param email User's email
     * @param secret TOTP secret
     * @return Base64 encoded QR code image as data URL
     */
    public String generateQrCodeDataUrl(String email, String secret) throws QrGenerationException {
        try {
            QrData data = qrDataFactory.newBuilder()
                    .label(email)
                    .secret(secret)
                    .issuer(ISSUER)
                    .build();

            String qrCodeText = data.getUri();
            
            // Generate QR code image
            BitMatrix bitMatrix = new MultiFormatWriter()
                    .encode(qrCodeText, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE);
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            
            byte[] imageBytes = outputStream.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            return "data:image/png;base64," + base64Image;
            
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            throw new QrGenerationException("Failed to generate QR code", e);
        }
    }

    /**
     * Verify a TOTP code
     * @param secret User's TOTP secret
     * @param code The 6-digit code from Google Authenticator
     * @return true if code is valid
     */
    public boolean verifyCode(String secret, String code) {
        try {
            boolean isValid = codeVerifier.isValidCode(secret, code);
            log.debug("TOTP code verification: {}", isValid ? "success" : "failed");
            return isValid;
        } catch (Exception e) {
            log.error("Error verifying TOTP code: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get current TOTP code for a secret (mainly for testing)
     */
    public String getCurrentCode(String secret) {
        try {
            long currentBucket = Math.floorDiv(timeProvider.getTime(), 30);
            return codeGenerator.generate(secret, currentBucket);
        } catch (Exception e) {
            log.error("Error generating TOTP code: {}", e.getMessage());
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }
}
