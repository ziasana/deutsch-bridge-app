package com.deutschbridge.backend.model.dto;

import java.util.List;
import java.util.Map;

/** Student-facing response - answer keys/explanations stripped. */
public record ExamExercisePublicResponse(
        String id,
        String title,
        String section,
        String taskType,
        String level,
        Integer partNumber,
        /** Resolved Teil number (see ExamTeilResolver) - the key for looking up the Teil's time configuration. */
        Integer teil,
        List<ExamPassagePublic> passages,
        List<ExamQuestionPublic> questions,
        List<String> answerOptions,
        List<String> answerOptionLabels,
        /** Shown to the student at the start of this Teil, before the passages/questions. */
        String teilDescription,
        /** SCHRIFTLICHER_AUSDRUCK only: the "mögliche Antwort" revealed via a button - not an answer key to strip, unlike questions' correctAnswer. */
        String modelSolution,
        /** General tip/mistake-avoidance guidance for this whole Teil - shown once on the results screen, not per question. */
        String defaultExplanation,
        String defaultCommonMistake,
        boolean completed,
        /** Percentage (0-100) from the most recent completed attempt, or null if never attempted. */
        Double lastScore,
        boolean requiresPlanning,
        List<String> leitpunkte,
        boolean bookmarked,
        /**
         * MUENDLICHER_AUSDRUCK only: the structured, German-only speaking content (topics / person + opinion + goals / scenario +
         * planning points, useful phrases, example answers, self-assessment). Null for every other section.
         */
        Map<String, Object> speaking
) {
}
