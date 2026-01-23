package com.deutschbridge.backend.model.dto;


import java.util.List;

public record NomenVerbConnectionResponse(
        String id,
        String word,
        String explanation,
        String example,
        String level,
        String tags,
        List<LearningProgressResponse> learningProgresses
) {
}
