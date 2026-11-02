package com.deutschbridge.backend.model.dto;

/** Non-secret view of the mail configuration in use (never includes the password). */
public record EmailConfigResponse(String host, Integer port, String username, String fromAddress, String fromName) {
}
