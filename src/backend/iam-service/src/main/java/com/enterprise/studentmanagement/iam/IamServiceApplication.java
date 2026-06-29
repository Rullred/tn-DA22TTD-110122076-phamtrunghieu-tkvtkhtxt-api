package com.enterprise.studentmanagement.iam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * IAM Service Application
 * Identity and Access Management Service for Enterprise Student Management System
 * 
 * Responsibilities:
 * - User authentication (login, logout)
 * - JWT token generation and validation (RS256)
 * - Refresh token management
 * - Account locking mechanism
 * - IP blacklist management
 * - Password encryption (BCrypt)
 * - Sensitive data encryption (AES-GCM)
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableDiscoveryClient
public class IamServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IamServiceApplication.class, args);
    }

}
