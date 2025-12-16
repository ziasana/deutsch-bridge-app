package com.deutschbridge.backend.model.dto;

public record ApiResponse<T>(
        String message,
        T data
) {}
