package com.deutschbridge.backend.model.dto.examsim;

/** @param verificationNote who checked the configuration against which official document (required to publish) */
public record PublishProfileRequest(String verificationNote, boolean acceptContentGaps) {
}
