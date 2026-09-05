package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.User;

public record AdminUserResponse(
        String id,
        String email,
        String displayName,
        String username,
        String role,
        boolean verified
) {
    public static AdminUserResponse fromEntity(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getUsername(),
                user.getRole(),
                user.isVerified()
        );
    }
}
