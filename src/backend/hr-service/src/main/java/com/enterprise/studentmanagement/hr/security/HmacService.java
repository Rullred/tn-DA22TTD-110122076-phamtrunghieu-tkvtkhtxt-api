package com.enterprise.studentmanagement.hr.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * HMAC Service
 * Provides HMAC-SHA256 signing and verification for internal service authentication
 */
@Slf4j
@Service
public class HmacService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String secretKey;

    public HmacService(@Value("${hmac.secret-key:}") String secretKey) {
        if (secretKey != null && !secretKey.isEmpty()) {
            this.secretKey = secretKey;
            log.info("HMAC service initialized with provided key");
        } else {
            this.secretKey = generateSecretKey();
            log.warn("HMAC service initialized with generated key. Set hmac.secret-key in production!");
        }
    }

    /**
     * Generate HMAC signature for a message
     */
    public String generateSignature(String message) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), 
                    HMAC_ALGORITHM
            );
            mac.init(secretKeySpec);
            
            byte[] signature = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signature);
            
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to generate HMAC signature", e);
            throw new RuntimeException("Failed to generate HMAC signature", e);
        }
    }

    /**
     * Verify HMAC signature
     */
    public boolean verifySignature(String message, String signature) {
        try {
            String expectedSignature = generateSignature(message);
            return constantTimeEquals(expectedSignature, signature);
        } catch (Exception e) {
            log.error("Failed to verify HMAC signature", e);
            return false;
        }
    }

    /**
     * Generate signature for HTTP request
     * Format: METHOD:PATH:TIMESTAMP:BODY
     */
    public String generateRequestSignature(String method, String path, long timestamp, String body) {
        String message = String.format("%s:%s:%d:%s", 
                method.toUpperCase(), 
                path, 
                timestamp, 
                body != null ? body : ""
        );
        return generateSignature(message);
    }

    /**
     * Verify HTTP request signature
     */
    public boolean verifyRequestSignature(String method, String path, long timestamp, 
                                         String body, String signature) {
        // Check timestamp (allow 5 minutes window)
        long currentTime = System.currentTimeMillis();
        long timeDiff = Math.abs(currentTime - timestamp);
        if (timeDiff > 300000) { // 5 minutes
            log.warn("Request timestamp is too old or in the future: {} ms difference", timeDiff);
            return false;
        }

        String message = String.format("%s:%s:%d:%s", 
                method.toUpperCase(), 
                path, 
                timestamp, 
                body != null ? body : ""
        );
        return verifySignature(message, signature);
    }

    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        
        if (aBytes.length != bBytes.length) {
            return false;
        }
        
        int result = 0;
        for (int i = 0; i < aBytes.length; i++) {
            result |= aBytes[i] ^ bBytes[i];
        }
        
        return result == 0;
    }

    /**
     * Generate random secret key
     */
    private String generateSecretKey() {
        byte[] key = new byte[32]; // 256 bits
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    /**
     * Generate secret key for configuration
     */
    public static String generateBase64SecretKey() {
        byte[] key = new byte[32]; // 256 bits
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}
