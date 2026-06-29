package com.enterprise.studentmanagement.iam.filter;

import com.enterprise.studentmanagement.iam.util.IpAddressUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Rate Limit Filter
 * Giới hạn: 100 requests/giây/IP
 * Trả về HTTP 429 Too Many Requests nếu vượt quá
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, String> stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final int MAX_REQUESTS_PER_SECOND = 100;
    private static final Duration WINDOW_DURATION = Duration.ofSeconds(1);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = IpAddressUtil.getClientIp(request);
        String key = RATE_LIMIT_PREFIX + clientIp;

        // Get current request count
        String countStr = stringRedisTemplate.opsForValue().get(key);
        int currentCount = countStr != null ? Integer.parseInt(countStr) : 0;

        if (currentCount >= MAX_REQUESTS_PER_SECOND) {
            // Rate limit exceeded
            log.warn("Rate limit exceeded for IP: {} - {} requests in 1 second", clientIp, currentCount);
            sendRateLimitExceededResponse(response, clientIp);
            return;
        }

        // Increment counter
        if (currentCount == 0) {
            // First request in this window, set with expiration
            stringRedisTemplate.opsForValue().set(key, "1", WINDOW_DURATION);
        } else {
            // Increment existing counter
            stringRedisTemplate.opsForValue().increment(key);
        }

        // Continue with the request
        filterChain.doFilter(request, response);
    }

    private void sendRateLimitExceededResponse(HttpServletResponse response, String clientIp) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("status", 429);
        errorResponse.put("error", "Too Many Requests");
        errorResponse.put("message", "Vượt quá giới hạn số lượng yêu cầu. Giới hạn: " + MAX_REQUESTS_PER_SECOND + " yêu cầu/giây");
        errorResponse.put("path", "");
        errorResponse.put("ip", clientIp);

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
