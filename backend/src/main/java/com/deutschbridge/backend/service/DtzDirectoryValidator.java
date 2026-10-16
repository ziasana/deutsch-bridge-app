package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamTaskType;

import java.util.List;

/**
 * Structural check for DTZ Lesen Teil 1 ({@link ExamTaskType#DIRECTORY_MATCHING}): the information source is the first passage
 * and there are exactly five multiple-choice situations with three distinct options and a correct answer that is one of them.
 * Other task types are not checked here.
 */
final class DtzDirectoryValidator {

    static final int QUESTION_COUNT = 5;
    static final int OPTION_COUNT = 3;

    private DtzDirectoryValidator() {
    }

    static void validate(ExamExerciseManualRequest request) {
        if (request.taskType() != ExamTaskType.DIRECTORY_MATCHING) return;

        if (request.passages() == null || request.passages().isEmpty()
                || request.passages().get(0).getContent() == null || request.passages().get(0).getContent().isBlank()) {
            throw new IllegalArgumentException("The information source (the first text) is required.");
        }
        List<ExamQuestion> questions = request.questions() != null ? request.questions() : List.of();
        if (questions.size() != QUESTION_COUNT) {
            throw new IllegalArgumentException("A directory exercise needs exactly " + QUESTION_COUNT + " situations (found " + questions.size() + ").");
        }
        for (ExamQuestion q : questions) {
            if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                throw new IllegalArgumentException("Every situation needs a text.");
            }
            if (q.getTaskType() != ExamTaskType.MULTIPLE_CHOICE) {
                throw new IllegalArgumentException("The situations of this exercise must be multiple choice.");
            }
            List<String> options = q.getOptions() != null ? q.getOptions() : List.of();
            if (options.size() != OPTION_COUNT || options.stream().anyMatch(o -> o == null || o.isBlank())
                    || options.stream().map(String::strip).distinct().count() != OPTION_COUNT) {
                throw new IllegalArgumentException("Every situation needs exactly " + OPTION_COUNT + " different, non-empty options.");
            }
            if (!options.contains(q.getCorrectAnswer())) {
                throw new IllegalArgumentException("The correct answer of a situation must be one of its options.");
            }
        }
    }
}
