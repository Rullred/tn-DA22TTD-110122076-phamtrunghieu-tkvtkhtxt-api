package com.enterprise.studentmanagement.hr.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

/**
 * JPA Auditing Configuration
 * Enables automatic auditing for entities
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    /**
     * Auditor provider
     * Returns the current user for audit fields
     * Extracts username from X-Username header set by API Gateway
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            try {
                ServletRequestAttributes attributes = 
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    String username = request.getHeader("X-Username");
                    
                    if (username != null && !username.isEmpty()) {
                        return Optional.of(username);
                    }
                }
            } catch (Exception e) {
                // If no request context (e.g., batch jobs, async tasks), use system
            }
            
            // Fallback to system for non-request contexts
            return Optional.of("system");
        };
    }
}
