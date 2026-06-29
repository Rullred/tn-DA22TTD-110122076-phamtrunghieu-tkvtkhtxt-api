package com.enterprise.studentmanagement.hr.exception;

/**
 * Exception thrown when a request is invalid
 */
public class BadRequestException extends RuntimeException {
    
    public BadRequestException(String message) {
        super(message);
    }
}
