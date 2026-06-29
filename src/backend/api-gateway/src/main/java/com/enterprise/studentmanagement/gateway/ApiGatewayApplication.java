package com.enterprise.studentmanagement.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * API Gateway Application
 * Central entry point for all client requests
 * 
 * Responsibilities:
 * - Route requests to appropriate microservices
 * - JWT token validation
 * - Rate limiting
 * - IP blacklist checking
 * - Request/response logging
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

}
