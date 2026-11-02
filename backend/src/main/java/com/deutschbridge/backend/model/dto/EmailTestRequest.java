package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.EmailTestType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EmailTestRequest(
        @NotBlank @Email String recipientEmail,
        @NotNull EmailTestType type
) {
}
