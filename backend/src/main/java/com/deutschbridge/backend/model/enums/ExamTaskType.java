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
    /**
     * Leseverstehen Teil 3: the reverse of MATCHING - short situations (questions) are matched to one
     * of several ads (passages, each usable once). correctAnswer is the matching passage's id, or
     * "X" when no ad fits.
     */
    SITUATION_MATCHING,
    /** DTZ Leseverstehen Teil 3: richtig/falsch (no "nicht im Text") statement about one passage. Only used as a question's type. */
    TRUE_FALSE,
    /**
     * DTZ Leseverstehen Teil 3: several short texts, each followed by two tasks - one TRUE_FALSE and one
     * MULTIPLE_CHOICE (a/b/c). Every question points at its text via sectionIndex and carries its own taskType.
     */
    TEXT_QUESTIONS,
    /** Sprachbausteine Teil 2: one running text with numbered gaps filled from a shared word pool. */
    WORD_BANK_CLOZE,
    /** Schriftlicher Ausdruck: a writing prompt with no grading, just a revealable model solution. */
    WRITING_TASK,
    /** Mündlicher Ausdruck Teil 1: introduce yourself and ask / answer questions on set topics. Not graded. */
    TOPIC_INTERVIEW,
    /** Mündlicher Ausdruck Teil 2: report another person's opinion, give your own, share experiences, react. Not graded. */
    OPINION_DISCUSSION,
    /** Mündlicher Ausdruck Teil 3: plan something together with a partner and reach a joint decision. Not graded. */
    JOINT_PLANNING
}
