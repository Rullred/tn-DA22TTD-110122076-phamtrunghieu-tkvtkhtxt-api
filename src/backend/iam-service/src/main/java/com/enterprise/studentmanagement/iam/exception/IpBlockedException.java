package com.enterprise.studentmanagement.iam.exception;

/**
 * Exception thrown when an IP address is blocked
 */
public class IpBlockedException extends RuntimeException {
    public IpBlockedException(String message) {
        super(message);
    }
}
