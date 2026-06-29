package com.enterprise.studentmanagement.iam.security;

import com.enterprise.studentmanagement.iam.config.JwtProperties;
import com.enterprise.studentmanagement.iam.entity.User;
import io.jsonwebtoken.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JWT Service
 * Handles JWT token generation and validation using RS256 algorithm
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;
    
    private PrivateKey privateKey;
    private PublicKey publicKey;

    /**
     * Initialize RSA keys after bean construction
     */
    @PostConstruct
    public void init() {
        try {
            loadKeys();
            log.info("JWT Service initialized with RS256 algorithm");
        } catch (Exception e) {
            log.error("Failed to initialize JWT Service", e);
            throw new RuntimeException("Failed to initialize JWT Service", e);
        }
    }

    /**
     * Load RSA keys from configuration or generate new ones
     */
    private void loadKeys() throws NoSuchAlgorithmException, InvalidKeySpecException, IOException {
        // Try to load from configuration first
        if (StringUtils.hasText(jwtProperties.getPrivateKey()) && 
            StringUtils.hasText(jwtProperties.getPublicKey())) {
            log.info("Loading RSA keys from configuration");
            privateKey = loadPrivateKeyFromString(jwtProperties.getPrivateKey());
            publicKey = loadPublicKeyFromString(jwtProperties.getPublicKey());
            return;
        }

        // Try to load from files
        try {
            log.info("Loading RSA keys from files");
            privateKey = loadPrivateKeyFromFile();
            publicKey = loadPublicKeyFromFile();
            return;
        } catch (IOException e) {
            log.warn("Could not load keys from files: {}", e.getMessage());
        }

        // Generate new keys if not found
        log.warn("No RSA keys found, generating new key pair");
        generateKeys();
    }

    /**
     * Load private key from PEM file
     */
    private PrivateKey loadPrivateKeyFromFile() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        ClassPathResource resource = new ClassPathResource("keys/private_key.pem");
        String key = new String(Files.readAllBytes(resource.getFile().toPath()));
        return loadPrivateKeyFromString(key);
    }

    /**
     * Load public key from PEM file
     */
    private PublicKey loadPublicKeyFromFile() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        ClassPathResource resource = new ClassPathResource("keys/public_key.pem");
        String key = new String(Files.readAllBytes(resource.getFile().toPath()));
        return loadPublicKeyFromString(key);
    }

    /**
     * Load private key from PEM string
     */
    private PrivateKey loadPrivateKeyFromString(String key) throws NoSuchAlgorithmException, InvalidKeySpecException {
        String privateKeyPEM = key
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        
        byte[] encoded = Base64.getDecoder().decode(privateKeyPEM);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(encoded);
        return keyFactory.generatePrivate(keySpec);
    }

    /**
     * Load public key from PEM string
     */
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
     * Generate new RSA key pair
     */
    private void generateKeys() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        privateKey = keyPair.getPrivate();
        publicKey = keyPair.getPublic();
        
        log.info("Generated new RSA 2048-bit key pair");
        log.warn("IMPORTANT: These keys are temporary and will be regenerated on restart!");
        log.warn("For production, generate keys using generate-keys.sh and configure them in application.yml");
    }

    /**
     * Generate access token for user
     */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiration = now.plus(jwtProperties.getAccessTokenTtl());

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("username", user.getUsername());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        claims.put("type", "access");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuer(jwtProperties.getIssuer())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    /**
     * Generate refresh token (UUID format)
     */
    public String generateRefreshToken() {
        return java.util.UUID.randomUUID().toString();
    }

    /**
     * Validate JWT token
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("JWT token is malformed: {}", e.getMessage());
        } catch (SecurityException e) {
            log.error("JWT signature validation failed: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT token is invalid: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extract claims from JWT token
     */
    public Claims getClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            log.error("Failed to extract claims from token", e);
            throw new RuntimeException("Invalid token", e);
        }
    }

    /**
     * Extract username from token
     */
    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extract user ID from token
     */
    public UUID getUserIdFromToken(String token) {
        Object userIdClaim = getClaims(token).get("userId");
        if (userIdClaim instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(String.valueOf(userIdClaim));
    }

    /**
     * Extract role from token
     */
    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = getClaims(token).getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Parse access token and extract claims
     */
    public JwtClaims parseAccessToken(String token) {
        Claims claims = getClaims(token);
        String userIdValue = claims.get("userId", String.class);
        String username = claims.getSubject();
        String roleStr = claims.get("role", String.class);
        
        UUID userId = UUID.fromString(userIdValue);
        
        // Convert role string to Role enum set
        java.util.Set<com.enterprise.studentmanagement.iam.entity.Role> roles = new java.util.HashSet<>();
        if (roleStr != null) {
            roles.add(com.enterprise.studentmanagement.iam.entity.Role.valueOf(roleStr));
        }
        
        return new JwtClaims(userId, username, roles);
    }

    /**
     * Get token expiration time
     */
    public Date getExpirationFromToken(String token) {
        return getClaims(token).getExpiration();
    }
}
