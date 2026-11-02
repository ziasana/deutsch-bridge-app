package com.deutschbridge.backend.model.enums;

public enum EmailTestType {
    /** Plain "this is a test" message, no links or tokens. */
    TEST,
    /** Real verification template, but with a placeholder token (the link is intentionally dead). */
    VERIFICATION,
    /** Real password-reset template, but with a placeholder token (the link is intentionally dead). */
    PASSWORD_RESET
}
