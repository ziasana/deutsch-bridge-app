package com.deutschbridge.backend.model.dto;

import java.util.List;

public record SenseResponse(
        String id,
        String pos,
        List<String> translations,
        List<ExampleResponse> examples
) {
}
