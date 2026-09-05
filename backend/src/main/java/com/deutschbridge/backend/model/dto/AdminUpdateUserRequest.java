package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.Pattern;

public record AdminUpdateUserRequest(
        String displayName,
        @Pattern(regexp = "ADMIN|STUDENT", message = "Role must be ADMIN or STUDENT")
        String role,
        Boolean verified
) {
}
