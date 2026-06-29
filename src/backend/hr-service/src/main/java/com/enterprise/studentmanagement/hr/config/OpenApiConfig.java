package com.enterprise.studentmanagement.hr.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) Configuration
 * Provides API documentation
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8082}")
    private String serverPort;

    @Bean
    public OpenAPI hrServiceOpenAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:" + serverPort);
        localServer.setDescription("Local Development Server");

        Server gatewayServer = new Server();
        gatewayServer.setUrl("http://localhost:8080");
        gatewayServer.setDescription("API Gateway");

        Contact contact = new Contact();
        contact.setName("Enterprise Student Management Team");
        contact.setEmail("support@enterprise.com");

        License license = new License();
        license.setName("Copyright © 2026");

        Info info = new Info()
                .title("HR Service API")
                .version("1.0.0")
                .description("Human Resource Management Service for Enterprise Student Management System. " +
                           "Manages students, teachers, classes, and enrollments.")
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, gatewayServer));
    }
}
