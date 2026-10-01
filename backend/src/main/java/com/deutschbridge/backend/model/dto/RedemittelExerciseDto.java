package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.RedemittelExerciseType;

import java.util.List;

/**
 * One practice/review question, written by an admin. The correct answer is never sent: the server
 * grades the chosen option text (or typed text) against the stored exercise.
 */
public record RedemittelExerciseDto(
        String exerciseId,
        String phraseId,
        RedemittelExerciseType type,
        String prompt,
        /** Production only: the situation/topic to write about. */
        String topic,
        /** The expression the learner should use or recall, when it is not part of the prompt. */
        String phrase,
        List<Option> options
) {
    public record Option(String id, String text) {
    }
}
