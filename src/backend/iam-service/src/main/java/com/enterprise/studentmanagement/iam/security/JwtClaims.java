package com.enterprise.studentmanagement.iam.security;

import com.enterprise.studentmanagement.iam.entity.Role;
import java.util.Set;
import java.util.UUID;

public record JwtClaims(UUID userId, String username, Set<Role> roles) {
}
