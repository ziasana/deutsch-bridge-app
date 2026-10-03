package com.deutschbridge.backend.model.dto;

/** Light row for the admin expression list - no examples, patterns or questions; the editor loads the full entry by id. */
public record ExpressionAdminRow(
        String id,
        String expression,
        String type,
        String level,
        String status,
        String meaningDe
) {
}
