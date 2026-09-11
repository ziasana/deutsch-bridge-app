package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;

public record ExamExerciseManualRequest(
        String title,
        ExamSection section,
        ExamTaskType taskType,
        LearningLevel level,
        Integer partNumber,
        List<ExamPassage> passages,
        List<ExamQuestion> questions,
        List<String> answerOptions,
        String defaultExplanation,
        String defaultCommonMistake,
        Boolean published
) {
}
