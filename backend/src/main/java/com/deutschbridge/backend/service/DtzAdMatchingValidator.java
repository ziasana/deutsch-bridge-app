package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Structural check for DTZ Lesen Teil 2 ({@link ExamTaskType#SITUATION_MATCHING} of the DTZ exam): exactly five situations, eight
 * advertisements (the passages), exactly one situation with the answer X and no advertisement used twice. Whether the texts really
 * support these answers is for the admin to review; other exams and parts are not checked here.
 */
final class DtzAdMatchingValidator {

    static final int SITUATION_COUNT = 5;
    static final int ADVERTISEMENT_COUNT = 8;
    static final int PART = 2;

    private DtzAdMatchingValidator() {
    }

    static void validate(ExamExerciseManualRequest request) {
        if (request.examType() != ExamType.DTZ || request.taskType() != ExamTaskType.SITUATION_MATCHING
                || request.section() != ExamSection.LESEVERSTEHEN
                || (request.partNumber() != null && request.partNumber() != PART)) {
            return;
        }
        List<ExamQuestion> questions = request.questions() != null ? request.questions() : List.of();
        if (questions.size() != SITUATION_COUNT) {
            throw new IllegalArgumentException("A DTZ advertisement exercise needs exactly " + SITUATION_COUNT + " situations (found " + questions.size() + ").");
        }
        int advertisements = request.passages() != null ? request.passages().size() : 0;
        if (advertisements != ADVERTISEMENT_COUNT) {
            throw new IllegalArgumentException("A DTZ advertisement exercise needs exactly " + ADVERTISEMENT_COUNT + " advertisements (found " + advertisements + ").");
        }
        Set<String> used = new HashSet<>();
        int none = 0;
        for (ExamQuestion q : questions) {
            if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                throw new IllegalArgumentException("Every situation needs a text.");
            }
            String answer = q.getCorrectAnswer();
            if (answer == null || answer.isBlank()) {
                throw new IllegalArgumentException("Every situation needs a correct advertisement or X.");
            }
            if ("X".equalsIgnoreCase(answer)) none++;
            else if (!used.add(answer)) throw new IllegalArgumentException("An advertisement is the correct answer for more than one situation.");
        }
        if (none != 1) {
            throw new IllegalArgumentException("Exactly one situation must have the answer X (found " + none + ").");
        }
    }
}
