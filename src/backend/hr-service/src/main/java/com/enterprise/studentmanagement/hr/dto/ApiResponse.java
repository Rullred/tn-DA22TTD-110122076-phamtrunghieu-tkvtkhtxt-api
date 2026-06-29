package com.enterprise.studentmanagement.hr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Standard API Response wrapper
 * Provides consistent response structure across all endpoints
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    private String error;

    /**
     * Create success response with data and message
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create success response with data only
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation successful");
    }

    /**
     * Create success response with message only
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create error response
     */
    public static <T> ApiResponse<T> error(String message, String error) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .error(error)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create error response with message only
     */
    public static <T> ApiResponse<T> error(String message) {
        return error(message, null);
    }
}
