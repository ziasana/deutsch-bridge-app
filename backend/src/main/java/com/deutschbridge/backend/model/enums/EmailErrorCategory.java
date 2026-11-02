package com.deutschbridge.backend.model.enums;

/** Coarse classification of an SMTP failure so the admin sees what to fix, not just a stack trace. */
public enum EmailErrorCategory {
    INVALID_RECIPIENT,
    AUTHENTICATION_FAILED,
    CONNECTION_FAILED,
    TIMEOUT,
    TLS_ERROR,
    SENDER_REJECTED,
    UNKNOWN
}
