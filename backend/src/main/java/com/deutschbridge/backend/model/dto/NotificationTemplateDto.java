package com.deutschbridge.backend.model.dto;

import java.util.List;

/** Admin view of one localized template. placeholders/defaultTitle/defaultBody are read-only helpers. */
public record NotificationTemplateDto(
        String templateKey,
        String language,
        String title,
        String body,
        List<String> placeholders,
        String defaultTitle,
        String defaultBody
) {
}
