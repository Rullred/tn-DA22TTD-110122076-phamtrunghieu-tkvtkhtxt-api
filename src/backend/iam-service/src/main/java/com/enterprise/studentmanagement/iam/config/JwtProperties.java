package com.enterprise.studentmanagement.iam.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * JWT Configuration Properties
 * Binds properties from application.yml under iam.security.jwt
 */
@Data
@Component
@ConfigurationProperties(prefix = "iam.security.jwt")
public class JwtProperties {

    /**
     * JWT issuer identifier
     */
    private String issuer = "enterprise-iam";

    /**
     * Access token time-to-live
     */
    private Duration accessTokenTtl = Duration.ofHours(1);

    /**
     * Refresh token time-to-live
     */
    private Duration refreshTokenTtl = Duration.ofDays(7);

    /**
     * RSA public key (PEM format or Base64 encoded)
     */
    private String publicKey;

    /**
     * RSA private key (PEM format or Base64 encoded)
     */
    private String privateKey;
}
