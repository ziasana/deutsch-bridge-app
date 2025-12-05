package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum Theme {
    DARK ("Dark"),
    LIGHT ("Light");

    private final String value;

    Theme(String value) { this.value = value; }

}
