package com.enterprise.studentmanagement.iam.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.Components;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) Configuration for IAM Service
 * Provides API documentation with JWT authentication support
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI iamServiceOpenAPI() {
        // Server configurations
        Server localServer = new Server();
        localServer.setUrl("http://localhost:" + serverPort);
        localServer.setDescription("Local Development Server");

        Server gatewayServer = new Server();
        gatewayServer.setUrl("http://localhost:8080");
        gatewayServer.setDescription("API Gateway");

        // Contact information
        Contact contact = new Contact();
        contact.setName("Enterprise Student Management Team");
        contact.setEmail("support@enterprise.com");

        // License information
        License license = new License();
        license.setName("Copyright © 2026");

        // API Information
        Info info = new Info()
                .title("IAM Service API")
                .version("1.0.0")
                .description("Identity and Access Management Service for Enterprise Student Management System. " +
                           "Handles authentication, authorization, user management, and security logging. " +
                           "\n\n**Features:**\n" +
                           "- User registration and authentication\n" +
                           "- JWT token-based security (RS256)\n" +
                           "- Role-based access control (RBAC)\n" +
                           "- Account locking and IP blocking\n" +
                           "- Security audit logging\n" +
                           "- Token refresh mechanism")
                .contact(contact)
                .license(license);

        // JWT Security Scheme
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization")
                .description("JWT Authentication. Enter your JWT token in the format: Bearer {token}");

        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("Bearer Authentication");

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, gatewayServer))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", securityScheme))
                .addSecurityItem(securityRequirement);
    }
}
