package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN ("Admin"),
    STUDENT ("Student"),;

    private final String value;

    UserRole(String value) { this.value = value; }
}
