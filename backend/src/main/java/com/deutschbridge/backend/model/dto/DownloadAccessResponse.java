package com.deutschbridge.backend.model.dto;

/**
 * Whether the signed-in learner may save content for offline use. {@code premiumOnly} tells clients
 * how to word the upsell when {@code allowed} is false.
 */
public record DownloadAccessResponse(boolean allowed, boolean premiumOnly) {
}
