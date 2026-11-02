package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code confirmEmail} must equal the target user's email: a server-side echo of the typed confirmation in the UI. */
public record AdminPermanentDeleteUserRequest(
        @NotBlank String confirmEmail
) {
}
