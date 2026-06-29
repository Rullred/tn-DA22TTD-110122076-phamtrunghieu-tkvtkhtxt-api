package com.enterprise.studentmanagement.iam.entity;

/**
 * User Role Enum
 * Defines the roles available in the system
 */
public enum UserRole {
    ADMIN,      // System administrator with full access
    TEACHER,    // Teacher with access to assigned classes
    STUDENT     // Student with limited access to own data
}
