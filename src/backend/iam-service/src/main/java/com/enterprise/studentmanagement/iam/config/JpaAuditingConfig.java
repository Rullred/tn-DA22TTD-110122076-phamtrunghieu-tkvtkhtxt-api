package com.enterprise.studentmanagement.iam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * JPA Auditing Configuration
 * Enables automatic auditing of entity creation and modification
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    /**
     * Provides the current auditor (user) for JPA auditing
     * Returns username from SecurityContext or "system" if not authenticated
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated() 
                    || "anonymousUser".equals(authentication.getPrincipal())) {
                return Optional.of("system");
            }
            
            return Optional.of(authentication.getName());
        };
    }
}
