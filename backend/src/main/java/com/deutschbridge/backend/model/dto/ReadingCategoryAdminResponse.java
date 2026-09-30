package com.deutschbridge.backend.model.dto;

/** Admin category table row - includes how many articles currently reference it (blocks delete when > 0). */
public record ReadingCategoryAdminResponse(String id, String title, long articleCount) {
}
