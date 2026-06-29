package com.enterprise.studentmanagement.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.UUID;

/**
 * JWT Validator
 * Validates JWT tokens using RSA public key
 */
@Slf4j
@Component
public class JwtValidator {

    @Value("${gateway.jwt.public-key:}")
    private String publicKeyConfig;

    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        try {
            loadPublicKey();
            log.info("JWT Validator initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize JWT Validator", e);
            throw new RuntimeException("Failed to initialize JWT Validator", e);
        }
    }

    private void loadPublicKey() throws NoSuchAlgorithmException, InvalidKeySpecException, IOException {
        // Try to load from configuration first
        if (StringUtils.hasText(publicKeyConfig)) {
            log.info("Loading public key from configuration");
            publicKey = loadPublicKeyFromString(publicKeyConfig);
            return;
        }

        // Try to load from file
        try {
            log.info("Loading public key from file");
            ClassPathResource resource = new ClassPathResource("keys/public_key.pem");
            String key = new String(Files.readAllBytes(resource.getFile().toPath()));
            publicKey = loadPublicKeyFromString(key);
        } catch (IOException e) {
            log.error("Could not load public key from file: {}", e.getMessage());
            throw e;
        }
    }

    private PublicKey loadPublicKeyFromString(String key) throws NoSuchAlgorithmException, InvalidKeySpecException {
        String publicKeyPEM = key
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        
        byte[] encoded = Base64.getDecoder().decode(publicKeyPEM);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(encoded);
        return keyFactory.generatePublic(keySpec);
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract claims from token
     */
    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Extract user ID from token
     */
    public UUID getUserId(String token) {
        Object userIdClaim = getClaims(token).get("userId");
        if (userIdClaim instanceof UUID uuid) {
            return uuid;
        }

        return UUID.fromString(String.valueOf(userIdClaim));
    }

    /**
     * Extract username from token
     */
    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extract role from token
     */
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }
}
