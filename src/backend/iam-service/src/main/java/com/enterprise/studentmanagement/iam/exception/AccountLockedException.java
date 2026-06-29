package com.enterprise.studentmanagement.iam.exception;

/**
 * Exception thrown when an account is locked due to failed login attempts
 */
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) {
        super(message);
    }
}
