package com.enterprise.studentmanagement.iam.security;

import com.enterprise.studentmanagement.iam.entity.Role;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public class UserPrincipal {

    private final UUID id;
    private final String username;
    private final Set<Role> roles;

    public UserPrincipal(UUID id, String username, Set<Role> roles) {
        this.id = id;
        this.username = username;
        this.roles = roles;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
            .collect(Collectors.toSet());
    }
}
