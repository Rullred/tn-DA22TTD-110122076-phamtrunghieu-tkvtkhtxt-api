package com.enterprise.studentmanagement.hr.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-GCM Encryption Service
 * Provides encryption and decryption for sensitive data
 */
@Slf4j
@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;
    private static final int AES_KEY_SIZE = 256;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public EncryptionService(@Value("${encryption.secret-key:}") String base64Key) {
        this.secureRandom = new SecureRandom();
        
        if (base64Key != null && !base64Key.isEmpty()) {
            // Use provided key
            byte[] decodedKey = Base64.getDecoder().decode(base64Key);
            this.secretKey = new SecretKeySpec(decodedKey, "AES");
            log.info("Encryption service initialized with provided key");
        } else {
            // Generate new key (for development only)
            this.secretKey = generateKey();
            log.warn("Encryption service initialized with generated key. Set encryption.secret-key in production!");
        }
    }

    /**
     * Encrypt plaintext using AES-GCM
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Encrypt
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV and ciphertext
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            // Encode to Base64
            return Base64.getEncoder().encodeToString(byteBuffer.array());

        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt ciphertext using AES-GCM
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isEmpty()) {
            return ciphertext;
        }

        try {
            // Decode from Base64
            byte[] decoded = Base64.getDecoder().decode(ciphertext);

            // Extract IV and ciphertext
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] encryptedData = new byte[byteBuffer.remaining()];
            byteBuffer.get(encryptedData);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            // Decrypt
            byte[] plaintext = cipher.doFinal(encryptedData);

            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * Generate AES key
     */
    private SecretKey generateKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(AES_KEY_SIZE, secureRandom);
            return keyGenerator.generateKey();
        } catch (Exception e) {
            log.error("Key generation failed", e);
            throw new RuntimeException("Key generation failed", e);
        }
    }

    /**
     * Generate Base64-encoded key for configuration
     */
    public static String generateBase64Key() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(AES_KEY_SIZE, new SecureRandom());
            SecretKey key = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(key.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Key generation failed", e);
        }
    }
}
