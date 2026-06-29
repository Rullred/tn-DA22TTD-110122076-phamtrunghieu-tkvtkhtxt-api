package com.enterprise.studentmanagement.iam.dto;

import com.enterprise.studentmanagement.iam.entity.Role;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String username;
    private String email;
    private Set<Role> roles;
    private boolean locked;
    private Instant lockUntil;
    private Instant lastLoginAt;

    public UserResponse(UUID id, String username, String email, Set<Role> roles, boolean locked, Instant lockUntil, Instant lastLoginAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.locked = locked;
        this.lockUntil = lockUntil;
        this.lastLoginAt = lastLoginAt;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public boolean isLocked() {
        return locked;
    }

    public Instant getLockUntil() {
        return lockUntil;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }
}
