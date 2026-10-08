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
        String promptVersion
) {

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
