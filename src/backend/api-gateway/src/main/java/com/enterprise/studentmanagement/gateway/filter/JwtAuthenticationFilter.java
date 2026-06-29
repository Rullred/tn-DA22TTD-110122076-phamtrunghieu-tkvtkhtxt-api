package com.enterprise.studentmanagement.gateway.filter;

import com.enterprise.studentmanagement.gateway.security.JwtValidator;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * JWT Authentication Filter
 * Validates JWT tokens and adds user information to request headers
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    @Autowired
    private JwtValidator jwtValidator;

    @Value("${gateway.excluded-paths:}")
    private String excludedPathsConfig;

    private List<String> excludedPaths = List.of();

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        if (StringUtils.hasText(excludedPathsConfig)) {
            excludedPaths = Arrays.stream(excludedPathsConfig.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
        }
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // Skip JWT validation for excluded paths
            if (isExcludedPath(path)) {
                log.debug("Skipping JWT validation for excluded path: {}", path);
                return chain.filter(exchange);
            }

            // Extract Authorization header
            String authHeader = request.getHeaders().getFirst("Authorization");
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing or invalid Authorization header for path: {}", path);
                return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            // Validate token
            if (!jwtValidator.validateToken(token)) {
                log.warn("Invalid JWT token for path: {}", path);
                return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            }

            try {
                // Extract user information from token
                UUID userId = jwtValidator.getUserId(token);
                String username = jwtValidator.getUsername(token);
                String role = jwtValidator.getRole(token);

                // Add user information to request headers for downstream services
                ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", userId.toString())
                        .header("X-Username", username)
                        .header("X-User-Role", role)
                        .build();

                ServerWebExchange modifiedExchange = exchange.mutate()
                        .request(modifiedRequest)
                        .build();

                log.debug("JWT validated successfully for user: {} ({})", username, role);
                
                return chain.filter(modifiedExchange);
                
            } catch (Exception e) {
                log.error("Error extracting user information from token", e);
                return onError(exchange, "Invalid token claims", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private boolean isExcludedPath(String path) {
        return excludedPaths.stream()
                .anyMatch(excluded -> {
                    if (excluded.endsWith("/**")) {
                        String prefix = excluded.substring(0, excluded.length() - 3);
                        return path.startsWith(prefix);
                    }
                    return path.equals(excluded);
                });
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
        
        String errorResponse = String.format(
                "{\"success\":false,\"message\":\"%s\",\"timestamp\":\"%s\"}",
                message,
                java.time.LocalDateTime.now()
        );
        
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes()))
        );
    }

    @Data
    public static class Config {
        // Configuration properties if needed
    }
}
