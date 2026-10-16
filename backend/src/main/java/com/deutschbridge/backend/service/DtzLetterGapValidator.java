package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamTaskType;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Structural check for DTZ Leseverstehen Teil 5 ({@link ExamTaskType#LETTER_GAP_FILL}): exactly one letter passage whose text carries the six
 * gap badges 40-45 once each and in ascending order, optionally one unscored example passage, and exactly six multiple-choice gap questions
 * numbered 40-45 with three distinct options and a correct option among them. Other task types are not checked here.
 */
public final class DtzLetterGapValidator {

    public static final int FIRST_NUMBER = 40;
    public static final int QUESTION_COUNT = 6;
    public static final int OPTION_COUNT = 3;

    private static final Pattern GAP = Pattern.compile("data-exam-gap=\"(\\d+)\"");

    private DtzLetterGapValidator() {
    }

    static void validate(ExamExerciseManualRequest request) {
        if (request.taskType() != ExamTaskType.LETTER_GAP_FILL) return;
        String problem = check(request.passages(), request.questions());
        if (problem != null) throw new IllegalArgumentException(problem);
    }

    /** The first problem found, or null when the exercise has the required shape (also used before publishing). */
    public static String check(List<ExamPassage> passages, List<ExamQuestion> questions) {
        List<ExamPassage> texts = passages != null ? passages : List.of();
        List<ExamQuestion> gaps = questions != null ? questions : List.of();
        List<ExamPassage> letters = texts.stream().filter(p -> p.getContent() != null && GAP.matcher(p.getContent()).find()).toList();
        if (letters.size() != 1) return "Exactly 1 letter or email with the gaps 40–45 is required (found " + letters.size() + " texts with gaps).";
        if (texts.size() > 2) return "Only the letter and an optional example are allowed (found " + texts.size() + " texts).";
        ExamPassage letter = letters.get(0);
        if (letter.getContent().replaceAll("<[^>]*>", "").isBlank()) return "The letter must not be empty.";

        List<Integer> numbers = new ArrayList<>();
        Matcher m = GAP.matcher(letter.getContent());
        while (m.find()) numbers.add(Integer.parseInt(m.group(1)));
        for (int n = FIRST_NUMBER; n < FIRST_NUMBER + QUESTION_COUNT; n++) {
            final int gap = n;
            long count = numbers.stream().filter(x -> x == gap).count();
            if (count == 0) return "The letter has no gap " + n + ".";
            if (count > 1) return "Gap " + n + " appears " + count + " times; every gap may appear once.";
        }
        if (numbers.stream().anyMatch(n -> n < FIRST_NUMBER || n >= FIRST_NUMBER + QUESTION_COUNT)) return "The letter may only contain the gaps 40–45.";
        List<Integer> sorted = new ArrayList<>(numbers);
        sorted.sort(Integer::compare);
        if (!sorted.equals(numbers)) return "The gaps must appear in ascending order (40, 41, ... 45).";

        if (gaps.size() != QUESTION_COUNT) return "Exactly " + QUESTION_COUNT + " gap questions are required (found " + gaps.size() + ").";
        List<ExamQuestion> ordered = gaps.stream()
                .sorted(java.util.Comparator.comparing(q -> q.getQuestionNumber() == null ? Integer.MAX_VALUE : q.getQuestionNumber()))
                .toList();
        for (int i = 0; i < ordered.size(); i++) {
            ExamQuestion q = ordered.get(i);
            int expected = FIRST_NUMBER + i;
            String label = "Gap " + expected;
            if (q.getQuestionNumber() == null || q.getQuestionNumber() != expected) return "Gap questions must be numbered 40 to 45.";
            if (q.getGapNumber() != null && q.getGapNumber() != expected) return label + ": the gap number does not match the question number.";
            if (q.getTaskType() != ExamTaskType.MULTIPLE_CHOICE) return label + " must be a multiple-choice question.";
            List<String> options = q.getOptions() == null ? List.of() : q.getOptions();
            if (options.size() != OPTION_COUNT || options.stream().anyMatch(o -> o == null || o.isBlank())) return label + " needs exactly 3 options (a, b, c).";
            Set<String> distinct = new HashSet<>();
            for (String option : options) distinct.add(option.strip().toLowerCase());
            if (distinct.size() != OPTION_COUNT) return label + " has two identical options.";
            if (q.getCorrectAnswer() == null || !options.contains(q.getCorrectAnswer())) return label + " has no valid correct option.";
        }
        return null;
    }
}
