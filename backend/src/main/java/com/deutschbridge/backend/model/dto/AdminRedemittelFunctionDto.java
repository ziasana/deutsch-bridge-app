package com.deutschbridge.backend.model.dto;

/** Admin read/write shape of a Redemittel function; {@code redemittelCount} is only filled on reads. */
public record AdminRedemittelFunctionDto(String id, String label, int sortOrder, long redemittelCount) {
}
