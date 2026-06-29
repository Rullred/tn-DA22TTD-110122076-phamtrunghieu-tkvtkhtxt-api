package com.enterprise.studentmanagement.iam.dto;

import com.enterprise.studentmanagement.iam.entity.User;
import com.enterprise.studentmanagement.iam.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User DTO
 * Data transfer object for user information (without sensitive data)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String username;
    private String email;
    private UserRole role;
    private Boolean isLocked;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    /**
     * Convert User entity to UserDto
     */
    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .isLocked(user.getIsLocked())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
