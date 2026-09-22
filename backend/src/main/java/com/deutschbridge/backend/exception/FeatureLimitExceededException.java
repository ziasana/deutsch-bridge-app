package com.deutschbridge.backend.exception;

public class FeatureLimitExceededException extends RuntimeException {
    public FeatureLimitExceededException(String message) {
        super(message);
    }
}
