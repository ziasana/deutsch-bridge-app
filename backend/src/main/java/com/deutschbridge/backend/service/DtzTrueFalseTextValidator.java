package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamTaskType;

import java.util.List;

/**
 * Structural check for DTZ Leseverstehen Teil 4 ({@link ExamTaskType#TEXT_TRUE_FALSE}): exactly one text and exactly three
 * richtig/falsch statements numbered 37-39, each with a usable answer key. Other task types are not checked here.
 */
public final class DtzTrueFalseTextValidator {

    public static final int FIRST_NUMBER = 37;
    public static final int QUESTION_COUNT = 3;

    private DtzTrueFalseTextValidator() {
    }

    static void validate(ExamExerciseManualRequest request) {
        if (request.taskType() != ExamTaskType.TEXT_TRUE_FALSE) return;
        String problem = check(request.passages(), request.questions());
        if (problem != null) throw new IllegalArgumentException(problem);
    }

    /** The first problem found, or null when the exercise has the required shape (also used before publishing). */
    public static String check(List<ExamPassage> passages, List<ExamQuestion> questions) {
        List<ExamPassage> texts = passages != null ? passages : List.of();
        List<ExamQuestion> tasks = questions != null ? questions : List.of();
        if (texts.size() != 1) return "Exactly 1 text is required (found " + texts.size() + ").";
        ExamPassage text = texts.get(0);
        if (text.getLabel() == null || text.getLabel().isBlank()) return "The text needs a title.";
        if (text.getContent() == null || text.getContent().replaceAll("<[^>]*>", "").isBlank()) return "The text must not be empty.";
        if (tasks.size() != QUESTION_COUNT) return "Exactly " + QUESTION_COUNT + " statements are required (found " + tasks.size() + ").";
        List<ExamQuestion> ordered = tasks.stream()
                .sorted(java.util.Comparator.comparing(q -> q.getQuestionNumber() == null ? Integer.MAX_VALUE : q.getQuestionNumber()))
                .toList();
        for (int i = 0; i < ordered.size(); i++) {
            ExamQuestion q = ordered.get(i);
            int expected = FIRST_NUMBER + i;
            if (q.getQuestionNumber() == null || q.getQuestionNumber() != expected) return "Statements must be numbered 37, 38 and 39.";
            String label = "Statement " + expected;
            if (q.getTaskType() != ExamTaskType.TRUE_FALSE) return label + " must be a richtig/falsch statement.";
            if (q.getSectionIndex() != null && q.getSectionIndex() != 0) return label + " must belong to the text.";
            if (q.getPrompt() == null || q.getPrompt().isBlank()) return label + " is empty.";
            if (!"RICHTIG".equals(q.getCorrectAnswer()) && !"FALSCH".equals(q.getCorrectAnswer())) return label + " must have RICHTIG or FALSCH as its correct answer.";
        }
        return null;
    }
}
