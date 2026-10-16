package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;

import java.util.List;

/**
 * Structural check for DTZ Leseverstehen Teil 3 and Hörverstehen Teil 3 ({@link ExamTaskType#TEXT_QUESTIONS}): every text (or
 * recording) carries exactly one richtig/falsch task and one multiple-choice task, each with a usable answer key. Other task types are
 * not checked here.
 */
final class DtzTextQuestionsValidator {

    /** The DTZ paper has three texts, each with a richtig/falsch task and a multiple-choice task of three options (tasks 31-36). */
    static final int TEXT_COUNT = 3;
    /** The DTZ listening paper has four conversations in Teil 3 (tasks 10-17). */
    static final int RECORDING_COUNT = 4;
    static final int OPTION_COUNT = 3;

    private DtzTextQuestionsValidator() {
    }

    static void validate(ExamExerciseManualRequest request) {
        if (request.taskType() != ExamTaskType.TEXT_QUESTIONS) return;

        List<ExamPassage> passages = request.passages() != null ? request.passages() : List.of();
        List<ExamQuestion> questions = request.questions() != null ? request.questions() : List.of();
        boolean listening = request.section() == ExamSection.HOERVERSTEHEN;
        int expected = listening ? RECORDING_COUNT : TEXT_COUNT;
        if (passages.size() != expected) {
            throw new IllegalArgumentException("Exactly " + expected + (listening ? " recordings" : " texts") + " are required (found " + passages.size() + ").");
        }

        int[] trueFalse = new int[passages.size()];
        int[] multipleChoice = new int[passages.size()];
        for (ExamQuestion q : questions) {
            Integer index = q.getSectionIndex();
            if (index == null || index < 0 || index >= passages.size()) {
                throw new IllegalArgumentException("Every task must belong to one of the texts.");
            }
            if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                throw new IllegalArgumentException("Every task needs a statement or question.");
            }
            if (q.getTaskType() == ExamTaskType.TRUE_FALSE) {
                if (!"RICHTIG".equals(q.getCorrectAnswer()) && !"FALSCH".equals(q.getCorrectAnswer())) {
                    throw new IllegalArgumentException("A richtig/falsch task must have RICHTIG or FALSCH as its correct answer.");
                }
                trueFalse[index]++;
            } else if (q.getTaskType() == ExamTaskType.MULTIPLE_CHOICE) {
                List<String> options = q.getOptions() != null ? q.getOptions() : List.of();
                if (options.size() != OPTION_COUNT || options.stream().anyMatch(o -> o == null || o.isBlank())) {
                    throw new IllegalArgumentException("A multiple-choice task needs exactly " + OPTION_COUNT + " non-empty options.");
                }
                if (!options.contains(q.getCorrectAnswer())) {
                    throw new IllegalArgumentException("The correct answer of a multiple-choice task must be one of its options.");
                }
                multipleChoice[index]++;
            } else {
                throw new IllegalArgumentException("Tasks of this exercise must be richtig/falsch or multiple choice.");
            }
        }
        for (int i = 0; i < passages.size(); i++) {
            if (trueFalse[i] != 1 || multipleChoice[i] != 1) {
                throw new IllegalArgumentException("Each text needs exactly one richtig/falsch task and one multiple-choice task.");
            }
        }
    }
}
