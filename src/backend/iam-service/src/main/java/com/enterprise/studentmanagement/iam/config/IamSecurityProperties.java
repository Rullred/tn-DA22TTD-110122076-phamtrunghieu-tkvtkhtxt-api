package com.enterprise.studentmanagement.iam.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "iam.security")
public class IamSecurityProperties {

    private Jwt jwt = new Jwt();
    private Password password = new Password();
    private LoginProtection loginProtection = new LoginProtection();

    public Jwt getJwt() {
        return jwt;
    }

    public void setJwt(Jwt jwt) {
        this.jwt = jwt;
    }

    public Password getPassword() {
        return password;
    }

    public void setPassword(Password password) {
        this.password = password;
    }

    public LoginProtection getLoginProtection() {
        return loginProtection;
    }

    public void setLoginProtection(LoginProtection loginProtection) {
        this.loginProtection = loginProtection;
    }

    public static class Jwt {
        private String issuer;
        private Duration accessTokenTtl;
        private Duration refreshTokenTtl;
        private String publicKey;
        private String privateKey;

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public Duration getAccessTokenTtl() {
            return accessTokenTtl;
        }

        public void setAccessTokenTtl(Duration accessTokenTtl) {
            this.accessTokenTtl = accessTokenTtl;
        }

        public Duration getRefreshTokenTtl() {
            return refreshTokenTtl;
        }

        public void setRefreshTokenTtl(Duration refreshTokenTtl) {
            this.refreshTokenTtl = refreshTokenTtl;
        }

        public String getPublicKey() {
            return publicKey;
        }

        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }

        public String getPrivateKey() {
            return privateKey;
        }

        public void setPrivateKey(String privateKey) {
            this.privateKey = privateKey;
        }
    }

    public static class Password {
        private int minLength;
        private int bcryptStrength;

        public int getMinLength() {
            return minLength;
        }

        public void setMinLength(int minLength) {
            this.minLength = minLength;
        }

        public int getBcryptStrength() {
            return bcryptStrength;
        }

        public void setBcryptStrength(int bcryptStrength) {
            this.bcryptStrength = bcryptStrength;
        }
    }

    public static class LoginProtection {
        private int userLockThreshold1;
        private Duration userLockDuration1;
        private int userLockThreshold2;
        private Duration userLockDuration2;
        private int ipBlockThreshold;

        public int getUserLockThreshold1() {
            return userLockThreshold1;
        }

        public void setUserLockThreshold1(int userLockThreshold1) {
            this.userLockThreshold1 = userLockThreshold1;
        }

        public Duration getUserLockDuration1() {
            return userLockDuration1;
        }

        public void setUserLockDuration1(Duration userLockDuration1) {
            this.userLockDuration1 = userLockDuration1;
        }

        public int getUserLockThreshold2() {
            return userLockThreshold2;
        }

        public void setUserLockThreshold2(int userLockThreshold2) {
            this.userLockThreshold2 = userLockThreshold2;
        }

        public Duration getUserLockDuration2() {
            return userLockDuration2;
        }

        public void setUserLockDuration2(Duration userLockDuration2) {
            this.userLockDuration2 = userLockDuration2;
        }

        public int getIpBlockThreshold() {
            return ipBlockThreshold;
        }

        public void setIpBlockThreshold(int ipBlockThreshold) {
            this.ipBlockThreshold = ipBlockThreshold;
        }
    }
}
