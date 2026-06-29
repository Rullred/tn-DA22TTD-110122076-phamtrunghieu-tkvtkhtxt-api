package com.enterprise.studentmanagement.gateway.filter;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Objects;

/**
 * Rate Limit Filter
 * Limits requests per second per IP address using Redis
 */
@Slf4j
@Component
public class RateLimitFilter extends AbstractGatewayFilterFactory<RateLimitFilter.Config> {

    @Autowired
    private RedisTemplate<String, String> stringRedisTemplate;

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Value("${gateway.rate-limit.requests-per-second:100}")
    private int requestsPerSecond;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofSeconds(1);

    @Value("${iam.base-url:http://iam-service:8080}")
    private String iamBaseUrl;

    public RateLimitFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String clientIp = getClientIp(exchange);
            String path = exchange.getRequest().getURI().getPath();
            boolean isAuthPath = "/api/auth/login".equals(path) || "/api/auth/register".equals(path);
            
            String key = (isAuthPath ? "rate_limit:auth:" : RATE_LIMIT_PREFIX) + clientIp;
            int limit = isAuthPath ? 2 : requestsPerSecond;

            try {
                // Increment counter
                Long count = stringRedisTemplate.opsForValue().increment(key);
                
                if (count == null) {
                    count = 0L;
                }

                // Set TTL on first request
                if (count == 1) {
                    stringRedisTemplate.expire(key, RATE_LIMIT_WINDOW);
                }

                // Check if rate limit exceeded
                if (count > limit) {
                    log.warn("Rate limit exceeded for IP: {} on path: {} (count: {})", clientIp, path, count);

                    // Prepare payload for IAM security log
                    String userAgent = exchange.getRequest().getHeaders().getFirst("User-Agent");
                    var payload = java.util.Map.of(
                            "ipAddress", clientIp,
                            "username", "anonymous",
                            "action", "RATE_LIMIT_EXCEEDED",
                            "result", "WARNING",
                            "message", String.format("Auth rate limit exceeded (count=%d, limit=%d) on path %s", count, limit, path),
                            "userAgent", userAgent
                    );

                    WebClient webClient = webClientBuilder.baseUrl(iamBaseUrl).build();
                    Mono<Void> persist = webClient.post()
                            .uri("/internal/security/logs")
                            .bodyValue(payload)
                            .retrieve()
                            .bodyToMono(Void.class)
                            .onErrorResume(e -> {
                                log.warn("Failed to persist rate-limit event to IAM: {}", e.getMessage());
                                return Mono.empty();
                            });

                    String errorMessage = isAuthPath 
                            ? "Thao tác quá nhanh. Vui lòng đợi và thử lại sau."
                            : "Rate limit exceeded. Please try again later.";
                    return persist.then(onError(exchange, errorMessage, HttpStatus.TOO_MANY_REQUESTS, limit));
                }

                log.debug("Rate limit check passed for IP: {} (count: {}/{})", clientIp, count, limit);
                
                return chain.filter(exchange);
                
            } catch (Exception e) {
                log.error("Error checking rate limit for IP: {}", clientIp, e);
                // Continue on error to avoid blocking legitimate requests
                return chain.filter(exchange);
            }
        };
    }

    private String getClientIp(ServerWebExchange exchange) {
        String[] ipHeaders = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };

        for (String header : ipHeaders) {
            String ip = exchange.getRequest().getHeaders().getFirst(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }

        return Objects.requireNonNull(exchange.getRequest().getRemoteAddress()).getAddress().getHostAddress();
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status, int limit) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
        exchange.getResponse().getHeaders().add("X-Rate-Limit-Limit", String.valueOf(limit));
        exchange.getResponse().getHeaders().add("X-Rate-Limit-Remaining", "0");
        
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
