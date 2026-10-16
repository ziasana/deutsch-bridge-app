package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Structural check for the DTZ Hörverstehen parts that are not covered by {@link DtzTextQuestionsValidator} (Teil 3):
 * <ul>
 *   <li>Teil 1 (Ansagen am Telefon, Durchsagen) and Teil 2 (Informationen in den Medien): one recording per task, each task a
 *   multiple-choice question with three options (a, b, c) - 4 resp. 5 recordings.</li>
 *   <li>Teil 4 (Unterschiedliche Meinungen): one recording, three persons, each matched to one statement of the shared pool; the pool has
 *   at least as many statements as persons (distractors are welcome) and no statement is used twice.</li>
 * </ul>
 * Other exams, sections and parts are not checked here.
 */
final class DtzHoerenValidator {

    static final int OPTION_COUNT = 3;
    static final int TEIL_1_RECORDINGS = 4;
    static final int TEIL_2_RECORDINGS = 5;
    static final int TEIL_4_PERSONS = 3;

    private DtzHoerenValidator() {
    }

    static void validate(ExamExerciseManualRequest request) {
        if (request.examType() != ExamType.DTZ || request.section() != ExamSection.HOERVERSTEHEN || request.taskType() == null) return;

        if (request.taskType() == ExamTaskType.STATEMENT_MATCHING) {
            validateOpinionMatching(request);
        } else if (request.taskType() == ExamTaskType.MULTIPLE_CHOICE) {
            validateRecordingChoices(request);
        }
    }

    private static void validateRecordingChoices(ExamExerciseManualRequest request) {
        int expected = request.partNumber() != null && request.partNumber() == 2 ? TEIL_2_RECORDINGS : TEIL_1_RECORDINGS;
        List<ExamPassage> passages = request.passages() != null ? request.passages() : List.of();
        List<ExamQuestion> questions = request.questions() != null ? request.questions() : List.of();
        if (passages.size() != expected) {
            throw new IllegalArgumentException("Exactly " + expected + " recordings are required (found " + passages.size() + ").");
        }
        if (questions.size() != expected) {
            throw new IllegalArgumentException("Exactly " + expected + " tasks are required, one per recording (found " + questions.size() + ").");
        }
        Set<Integer> covered = new HashSet<>();
        for (ExamQuestion q : questions) {
            Integer index = q.getSectionIndex();
            if (index == null || index < 0 || index >= passages.size() || !covered.add(index)) {
                throw new IllegalArgumentException("Every recording needs exactly one task.");
            }
            if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                throw new IllegalArgumentException("Every task needs a question.");
            }
            List<String> options = q.getOptions() != null ? q.getOptions() : List.of();
            if (options.size() != OPTION_COUNT || options.stream().anyMatch(o -> o == null || o.isBlank())) {
                throw new IllegalArgumentException("A multiple-choice task needs exactly " + OPTION_COUNT + " non-empty options.");
            }
            if (!options.contains(q.getCorrectAnswer())) {
                throw new IllegalArgumentException("The correct answer of a multiple-choice task must be one of its options.");
            }
        }
    }

    private static void validateOpinionMatching(ExamExerciseManualRequest request) {
        List<ExamPassage> passages = request.passages() != null ? request.passages() : List.of();
        List<ExamQuestion> questions = request.questions() != null ? request.questions() : List.of();
        List<String> pool = request.answerOptions() != null ? request.answerOptions() : List.of();
        if (passages.size() != 1) {
            throw new IllegalArgumentException("A DTZ opinion exercise needs exactly one recording (found " + passages.size() + ").");
        }
        if (questions.size() != TEIL_4_PERSONS) {
            throw new IllegalArgumentException("A DTZ opinion exercise needs exactly " + TEIL_4_PERSONS + " persons (found " + questions.size() + ").");
        }
        if (pool.size() < TEIL_4_PERSONS || pool.stream().anyMatch(o -> o == null || o.isBlank())) {
            throw new IllegalArgumentException("The statements need at least " + TEIL_4_PERSONS + " non-empty entries.");
        }
        Set<String> used = new HashSet<>();
        for (ExamQuestion q : questions) {
            if (q.getPrompt() == null || q.getPrompt().isBlank()) {
                throw new IllegalArgumentException("Every person needs a name or description.");
            }
            if (q.getCorrectAnswer() == null || !pool.contains(q.getCorrectAnswer())) {
                throw new IllegalArgumentException("Every person needs a correct statement from the list.");
            }
            if (!used.add(q.getCorrectAnswer())) {
                throw new IllegalArgumentException("A statement is the correct answer for more than one person.");
            }
        }
    }
}
