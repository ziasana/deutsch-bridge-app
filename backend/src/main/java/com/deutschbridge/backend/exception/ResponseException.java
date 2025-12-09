package com.deutschbridge.backend.exception;

import java.time.LocalDateTime;

public record ResponseException(LocalDateTime  dateTime, String message, int status) {

    public ResponseException(String message, int status) {
        this(LocalDateTime.now(), message,status);
    }
}
