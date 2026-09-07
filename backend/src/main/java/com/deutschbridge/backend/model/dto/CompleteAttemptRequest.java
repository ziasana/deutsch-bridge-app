package com.deutschbridge.backend.model.dto;

import java.util.List;

public record CompleteAttemptRequest(
        List<String> wordsTapped,
        List<String> wordsSaved
) {
}
