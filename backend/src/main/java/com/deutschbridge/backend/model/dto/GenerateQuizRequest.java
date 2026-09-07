package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;

public record GenerateQuizRequest(
        String content,
        LearningLevel level,
        List<Annotation> annotations
) {
}
