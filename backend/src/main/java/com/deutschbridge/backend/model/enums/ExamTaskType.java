package com.deutschbridge.backend.model.enums;

/**
 * Real Telc exam part shapes, shared across exam sections since the underlying grading mechanics
 * (server-stored correctAnswer, optional shared answerOptions pool) are the same regardless of
 * which section an exercise belongs to.
 */
public enum ExamTaskType {
    /** Leseverstehen Teil 1: match each passage to one headline from a shared pool. */
    MATCHING,
    /** Leseverstehen Teil 2: standard multiple-choice comprehension questions. */
    MULTIPLE_CHOICE,
    /** Leseverstehen Teil 3: richtig/falsch/nicht im Text statements about short passages. */
    TRUE_FALSE_NOT_GIVEN,
    /** Sprachbausteine Teil 2: one running text with numbered gaps filled from a shared word pool. */
    WORD_BANK_CLOZE,
    /** Schriftlicher Ausdruck: a writing prompt with no grading, just a revealable model solution. */
    WRITING_TASK
}
