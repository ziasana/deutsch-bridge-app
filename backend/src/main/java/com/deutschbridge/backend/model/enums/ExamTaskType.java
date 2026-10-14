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
    /** DTZ Leseverstehen Teil 4: one information text and three richtig/falsch statements (tasks 37-39). Every question is a TRUE_FALSE pointing at the text. */
    TEXT_TRUE_FALSE,
    /** DTZ Leseverstehen Teil 5: one letter or email with six gaps (40-45), each closed with one of three options (a, b, c). Every question is a MULTIPLE_CHOICE. */
    LETTER_GAP_FILL,
    /**
     * DTZ Leseverstehen Teil 1 (Kataloge, Register, Verzeichnisse verstehen): one shared information source (directory, register,
     * catalogue ...) as the only passage and five multiple-choice situations (a, b, c) that are solved with it.
     */
    DIRECTORY_MATCHING,
    /** Sprachbausteine Teil 2: one running text with numbered gaps filled from a shared word pool. */
    WORD_BANK_CLOZE,
    /** Schriftlicher Ausdruck: a writing prompt with no grading, just a revealable model solution. */
    WRITING_TASK,
    /**
     * DTZ Schreiben: two alternative letter / email tasks (Aufgabe A and B) of which the learner answers exactly one. Each task has a situation,
     * an optional recipient, a writing instruction and exactly four content points. Stored in one exercise: one passage per task plus the
     * structured tasks in {@code metadata.writingChoice}.
     */
    WRITING_TASK_CHOICE,
    /**
     * DTZ Mündliche Prüfung Teil 1 (Über sich sprechen): one fixed template with the six introductory topics (Name, Geburtsort, Wohnort,
     * Arbeit/Beruf, Familie, Sprachen). Stored in {@code metadata.dtzOral}; not graded.
     */
    SELF_INTRODUCTION,
    /**
     * DTZ Mündliche Prüfung Teil 2 (Über Erfahrungen sprechen): one photo with a picture description (participant A) and experience
     * questions on two levels, A2 and B1 (participant B). Needs an attached image before it can be published. Not graded.
     */
    PHOTO_EXPERIENCE,
    /** Mündlicher Ausdruck Teil 1: introduce yourself and ask / answer questions on set topics. Not graded. */
    TOPIC_INTERVIEW,
    /** Mündlicher Ausdruck Teil 2: report another person's opinion, give your own, share experiences, react. Not graded. */
    OPINION_DISCUSSION,
    /** Mündlicher Ausdruck Teil 3 (Telc and DTZ): plan something together with a partner and reach a joint decision. Not graded. */
    JOINT_PLANNING
}
