package com.enterprise.studentmanagement.iam.entity;

public enum SecurityEventType {
    REGISTER_SUCCESS,
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    ACCOUNT_LOCKED,
    IP_BLOCKED,
    TOKEN_REFRESH,
    LOGOUT,
    PASSWORD_CHANGED,
    ACCOUNT_UNLOCKED,
    IP_UNBLOCKED
}
