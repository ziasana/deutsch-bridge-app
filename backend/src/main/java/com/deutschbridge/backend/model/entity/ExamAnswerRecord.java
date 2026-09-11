package com.deutschbridge.backend.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Unlike QuizAnswerRecord, this snapshots the feedback text shown at grading time, so a
 * learner's attempt history stays consistent even if an admin edits the exercise afterward.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAnswerRecord {
    private String questionId;
    private String answer;
    private boolean correct;
    private String explanation;
    private String commonMistake;
}
