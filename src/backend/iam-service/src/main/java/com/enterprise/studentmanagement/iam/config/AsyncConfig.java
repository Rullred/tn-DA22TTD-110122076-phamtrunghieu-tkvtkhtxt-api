package com.enterprise.studentmanagement.iam.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Async Configuration
 * Enables asynchronous method execution
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Async configuration for @Async methods
    // Uses default Spring async executor
}
