package com.enterprise.studentmanagement.gateway.config;

import com.enterprise.studentmanagement.gateway.filter.IpBlacklistFilter;
import com.enterprise.studentmanagement.gateway.filter.JwtAuthenticationFilter;
import com.enterprise.studentmanagement.gateway.filter.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway Configuration
 * Configures routes and filters for API Gateway
 */
@Configuration
@RequiredArgsConstructor
public class GatewayConfig {

    private final IpBlacklistFilter ipBlacklistFilter;
    private final RateLimitFilter rateLimitFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // IAM Service Routes
                .route("iam-auth", r -> r
                        .path("/api/auth/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config())))
                        .uri("lb://iam-service"))
                
                .route("iam-users", r -> r
                        .path("/api/users/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://iam-service"))
                
                // HR Service Routes
                .route("hr-students", r -> r
                        .path("/api/students/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))
                
                .route("hr-teachers", r -> r
                        .path("/api/teachers/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))
                
                .route("hr-classes", r -> r
                        .path("/api/classes/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))

                .route("hr-curriculum", r -> r
                        .path("/api/curriculum/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))

                .route("hr-quizzes", r -> r
                        .path("/api/quizzes/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))

                .route("hr-learning", r -> r
                        .path("/api/learning/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))

                .route("hr-forum", r -> r
                        .path("/api/forum/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))

                .route("hr-proposals", r -> r
                        .path("/api/proposals/**")
                        .filters(f -> f
                                .filter(ipBlacklistFilter.apply(new IpBlacklistFilter.Config()))
                                .filter(rateLimitFilter.apply(new RateLimitFilter.Config()))
                                .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://hr-service"))

                .build();
    }
}
