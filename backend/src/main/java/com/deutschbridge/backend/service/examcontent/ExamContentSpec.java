package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;

/**
 * The versioned content specification of one exam task: which exam / level / section / Teil it is, how
 * many headings and texts an exercise must have, and which prompt template produces it. Validation,
 * import and prompt generation are all driven by this, so supporting a new exam part (or a different
 * exam such as TestDaF) means registering one more spec in {@link ExamContentSpecs}.
 *
 * @param headingCount number of candidate headings (answer options) in the shared pool
 * @param textCount    number of texts that have to be matched to a heading
 * @param questionCount      multiple-choice exercises: number of questions about the one reading text (0 otherwise)
 * @param optionCount        multiple-choice exercises: answer options per question (0 otherwise)
 * @param firstQuestionNumber multiple-choice exercises: exam number of the first question (e.g. 6 for Lesen Teil 2)
 */
public record ExamContentSpec(
        ExamType examType,
        LearningLevel level,
        ExamSection section,
        int part,
        ExamTaskType taskType,
        int headingCount,
        int textCount,
        int minWords,
        int maxWords,
        String defaultInstructions,
        String promptTemplate,
        String promptVersion,
        int questionCount,
        int optionCount,
        int firstQuestionNumber
) {

    /** A "match N texts to M headings" spec. */
    public ExamContentSpec(ExamType examType, LearningLevel level, ExamSection section, int part, ExamTaskType taskType,
                           int headingCount, int textCount, int minWords, int maxWords,
                           String defaultInstructions, String promptTemplate, String promptVersion) {
        this(examType, level, section, part, taskType, headingCount, textCount, minWords, maxWords,
                defaultInstructions, promptTemplate, promptVersion, 0, 0, 0);
    }

    /** True for "one reading text + N multiple-choice questions" specs (Lesen Teil 2), false for headings matching. */
    public boolean isMultipleChoice() {
        return taskType == ExamTaskType.MULTIPLE_CHOICE;
    }

    /** Option ids a, b, c ... in order. */
    public java.util.List<String> optionIds() {
        return java.util.stream.IntStream.range(0, optionCount).mapToObj(i -> String.valueOf((char) ('a' + i))).toList();
    }

    public int lastQuestionNumber() {
        return firstQuestionNumber + questionCount - 1;
    }

    public int unusedHeadingCount() {
        return headingCount - textCount;
    }

    /** Short human label, e.g. "TELC B1 · Lesen · Teil 1". */
    public String label() {
        return examType.getValue() + " " + level.getValue() + " · " + ExamContentTokens.sectionLabel(section) + " · Teil " + part;
    }

    /** Prefix of generated external ids, e.g. "B1-L1-" for TELC and "TESTDAF-B2-L1-" for the other exams. */
    public String externalIdPrefix() {
        String base = level.getValue() + "-" + ExamContentTokens.sectionLetter(section) + part + "-";
        return examType == ExamType.TELC ? base : examType.name() + "-" + base;
    }

    /** Heading ids a, b, c ... in order. */
    public java.util.List<String> headingIds() {
        return java.util.stream.IntStream.range(0, headingCount).mapToObj(i -> String.valueOf((char) ('a' + i))).toList();
    }

    /** Text ids text_1, text_2 ... in order. */
    public java.util.List<String> textIds() {
        return java.util.stream.IntStream.rangeClosed(1, textCount).mapToObj(i -> "text_" + i).toList();
    }

    public boolean matches(ExamType examType, LearningLevel level, ExamSection section, int part) {
        return this.examType == examType && this.level == level && this.section == section && this.part == part;
    }
}
