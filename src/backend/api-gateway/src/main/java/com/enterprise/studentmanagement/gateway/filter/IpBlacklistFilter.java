package com.enterprise.studentmanagement.gateway.filter;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * IP Blacklist Filter
 * Blocks requests from blacklisted IP addresses
 * This filter runs first (highest priority)
 */
@Slf4j
@Component
public class IpBlacklistFilter extends AbstractGatewayFilterFactory<IpBlacklistFilter.Config> implements Ordered {

    @Autowired
    private RedisTemplate<String, String> stringRedisTemplate;

    private static final String IP_BLACKLIST_PREFIX = "ip_blacklist:";

    public IpBlacklistFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String clientIp = getClientIp(exchange);
            String key = IP_BLACKLIST_PREFIX + clientIp;

            try {
                // Check if IP is blacklisted
                Boolean isBlocked = stringRedisTemplate.hasKey(key);
                
                if (Boolean.TRUE.equals(isBlocked)) {
                    log.warn("Blocked request from blacklisted IP: {}", clientIp);
                    return onError(exchange, "Access denied. Your IP address has been blocked.", HttpStatus.FORBIDDEN);
                }

                log.debug("IP blacklist check passed for: {}", clientIp);
                
                return chain.filter(exchange);
                
            } catch (Exception e) {
                log.error("Error checking IP blacklist for: {}", clientIp, e);
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

    @Override
    public int getOrder() {
        return -1; // Highest priority - run first
    }

    @Data
    public static class Config {
        // Configuration properties if needed
    }
}
