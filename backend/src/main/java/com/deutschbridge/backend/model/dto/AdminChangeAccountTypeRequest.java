package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.Pattern;

public record AdminChangeAccountTypeRequest(
        @Pattern(regexp = "BASIC|PREMIUM", message = "Account type must be BASIC or PREMIUM")
        String accountType
) {
}
