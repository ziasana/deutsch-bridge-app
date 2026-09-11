package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestion {
    private String id;
    private ExamTaskType taskType;

    /** Question/statement text. For MATCHING, an optional custom prompt (e.g. "Welche Überschrift passt zu Text 1?"). */
    private String prompt;

    /** Which passage this item refers to (index into the exercise's passages list). Used by MATCHING and TRUE_FALSE_NOT_GIVEN. */
    private Integer sectionIndex;

    /** MULTIPLE_CHOICE options; null for MATCHING (which uses the exercise-level shared answerOptions pool) and TRUE_FALSE_NOT_GIVEN. */
    private List<String> options;

    /**
     * MC: matches an options entry. TFN: "RICHTIG"|"FALSCH"|"NICHT_IM_TEXT". MATCHING/WORD_BANK_CLOZE:
     * matches an entry in the exercise's shared answerOptions pool.
     */
    private String correctAnswer;

    /** WORD_BANK_CLOZE only: the gap's number, matching the marker embedded in the passage's content. */
    private Integer gapNumber;

    /** Admin-authored: how to approach this question type / why the answer is correct. */
    private String explanation;

    /** Admin-authored: common-mistake guidance for this question. */
    private String commonMistake;

    public ExamQuestion ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = NanoIdUtils.randomNanoId();
        }
        return this;
    }
}
