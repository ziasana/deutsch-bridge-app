package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.RedemittelExerciseDto;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns an admin-authored {@link RedemittelExercise} into what the learner sees, and grades answers
 * against it. Nothing is generated: every question, option and answer comes from the admin.
 * Multiple-choice options are the option texts themselves (shuffled), so the answer is not leaked.
 */
class RedemittelExerciseFactory {

    /** A trailing ellipsis, with the question mark or period that may follow it ("Wie wäre es mit …?"). */
    private static final Pattern TRAILING_ELLIPSIS = Pattern.compile("\\s*…[\\s…]*[?!.]?\\s*$|(\\.\\.\\.)+\\s*[?!.]?\\s*$|\\s+$");

    private final Random random;

    RedemittelExerciseFactory(Random random) {
        this.random = random;
    }

    RedemittelExerciseDto toDto(RedemittelExercise ex, WritingPhrase phrase) {
        return switch (ex.getType()) {
            case FUNCTION, CLOZE, WORD_ORDER -> throw new IllegalArgumentException("Derived type has no stored exercise: " + ex.getType());
            case MEANING -> choice(ex, phrase, ex.getPrompt() != null ? ex.getPrompt() : "Was bedeutet: „" + core(phrase.getPhrase()) + "“");
            case SITUATION -> choice(ex, phrase, ex.getPrompt());
            case FILL_BLANK -> new RedemittelExerciseDto(ex.getId(), phrase.getId(), ex.getType(),
                    "Ergänze das fehlende Wort:\n\n" + ex.getPrompt(), null, null, null);
            case PRODUCTION -> new RedemittelExerciseDto(ex.getId(), phrase.getId(), ex.getType(),
                    "Schreibe einen eigenen Satz mit diesem Redemittel.", ex.getPrompt(), core(phrase.getPhrase()), null);
        };
    }

    private RedemittelExerciseDto choice(RedemittelExercise ex, WritingPhrase phrase, String prompt) {
        List<String> texts = new ArrayList<>(RedemittelText.splitLines(ex.getWrongAnswers()));
        texts.add(ex.getCorrectAnswer());
        Collections.shuffle(texts, random);
        List<RedemittelExerciseDto.Option> options = texts.stream().map(t -> new RedemittelExerciseDto.Option(t, t)).toList();
        return new RedemittelExerciseDto(ex.getId(), phrase.getId(), ex.getType(), prompt, null, null, options);
    }

    boolean isCorrect(RedemittelExercise ex, String answer) {
        if (answer == null || answer.isBlank()) return false;
        return switch (ex.getType()) {
            case FUNCTION, CLOZE, WORD_ORDER -> false;
            case MEANING, SITUATION -> answer.strip().equalsIgnoreCase(ex.getCorrectAnswer().strip());
            case FILL_BLANK -> normalize(answer).equals(normalize(ex.getCorrectAnswer()));
            case PRODUCTION -> true;
        };
    }

    /** What to show as "the right answer" after a question. */
    String correctAnswer(RedemittelExercise ex) {
        return ex.getCorrectAnswer() == null ? "" : ex.getCorrectAnswer();
    }

    /** For PRODUCTION: the example (or the expression) to compare against after the learner wrote their own. */
    String modelAnswer(WritingPhrase phrase) {
        return phrase.getExample() != null && !phrase.getExample().isBlank() ? phrase.getExample() : phrase.getPhrase();
    }

    /** The phrase without its alternatives ("A / B" -> "A") and trailing ellipsis. */
    static String core(String phrase) {
        String first = phrase.split("\\s*/\\s*")[0].strip();
        return TRAILING_ELLIPSIS.matcher(first).replaceAll("").strip();
    }

    private static String normalize(String s) {
        return s.replaceAll("[^\\p{L}\\p{N}]", "").toLowerCase(Locale.ROOT);
    }

    // ---- derived exercises (no stored row; id "auto:TYPE") ----

    static final String AUTO_PREFIX = "auto:";
    static final String BLANK = "________";
    private static final int WORD_ORDER_MIN = 4;
    private static final int WORD_ORDER_MAX = 14;

    static String autoId(RedemittelExerciseType type) {
        return AUTO_PREFIX + type.name();
    }

    /** The derived type behind an exercise id like "auto:CLOZE", or empty for a stored exercise id. */
    static Optional<RedemittelExerciseType> autoType(String exerciseId) {
        if (exerciseId == null || !exerciseId.startsWith(AUTO_PREFIX)) return Optional.empty();
        try {
            RedemittelExerciseType t = RedemittelExerciseType.valueOf(exerciseId.substring(AUTO_PREFIX.length()));
            return t.isDerived() ? Optional.of(t) : Optional.empty();
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** Whether the phrase has what this derived type needs (FUNCTION always; the others need an example sentence). */
    boolean canDerive(RedemittelExerciseType type, WritingPhrase phrase) {
        return switch (type) {
            case FUNCTION -> true;
            case CLOZE -> clozeBlank(phrase).isPresent();
            case WORD_ORDER -> wordOrderTokens(phrase).isPresent();
            default -> false;
        };
    }

    /** @param functionLabels the labels of all functions, the pool the wrong "Funktion" options are drawn from */
    Optional<RedemittelExerciseDto> derive(RedemittelExerciseType type, WritingPhrase phrase, List<String> functionLabels) {
        if (!canDerive(type, phrase)) return Optional.empty();
        String id = autoId(type);
        return Optional.of(switch (type) {
            case FUNCTION -> function(id, phrase, functionLabels);
            case CLOZE -> new RedemittelExerciseDto(id, phrase.getId(), type,
                    "Ergänze den Satz mit dem passenden Redemittel:\n\n" + clozeBlank(phrase).orElseThrow()
                            + "\n\nFunktion: " + phrase.getCategory().getLabel(), null, null, null);
            case WORD_ORDER -> wordOrder(id, phrase);
            default -> throw new IllegalArgumentException(type.name());
        });
    }

    private RedemittelExerciseDto function(String id, WritingPhrase phrase, List<String> functionLabels) {
        List<String> others = new ArrayList<>(functionLabels);
        others.remove(phrase.getCategory().getLabel());
        Collections.shuffle(others, random);
        List<String> texts = new ArrayList<>(others.stream().limit(2).toList());
        texts.add(phrase.getCategory().getLabel());
        Collections.shuffle(texts, random);
        return new RedemittelExerciseDto(id, phrase.getId(), RedemittelExerciseType.FUNCTION,
                "Wofür verwendest du: „" + core(phrase.getPhrase()) + "“",
                null, null, texts.stream().map(t -> new RedemittelExerciseDto.Option(t, t)).toList());
    }

    private RedemittelExerciseDto wordOrder(String id, WritingPhrase phrase) {
        List<String> tokens = wordOrderTokens(phrase).orElseThrow();
        List<String> shuffled = new ArrayList<>(tokens);
        for (int attempt = 0; attempt < 5; attempt++) {
            Collections.shuffle(shuffled, random);
            if (!shuffled.equals(tokens)) break;
        }
        List<RedemittelExerciseDto.Option> options = new ArrayList<>();
        for (int i = 0; i < shuffled.size(); i++) options.add(new RedemittelExerciseDto.Option(String.valueOf(i), shuffled.get(i)));
        return new RedemittelExerciseDto(id, phrase.getId(), RedemittelExerciseType.WORD_ORDER,
                "Bringe die Wörter in die richtige Reihenfolge.", null, null, options);
    }

    boolean isCorrectDerived(RedemittelExerciseType type, WritingPhrase phrase, String answer) {
        if (answer == null || answer.isBlank()) return false;
        return switch (type) {
            case FUNCTION -> answer.strip().equalsIgnoreCase(phrase.getCategory().getLabel());
            case CLOZE -> Arrays.stream(phrase.getPhrase().split("\\s*/\\s*"))
                    .anyMatch(alt -> normalize(core(alt)).equals(normalize(answer)));
            case WORD_ORDER -> wordOrderTokens(phrase).map(t -> String.join(" ", t).equals(String.join(" ", answer.strip().split("\\s+")))).orElse(false);
            default -> false;
        };
    }

    String correctAnswerDerived(RedemittelExerciseType type, WritingPhrase phrase) {
        return switch (type) {
            case FUNCTION -> phrase.getCategory().getLabel();
            case CLOZE -> core(phrase.getPhrase());
            case WORD_ORDER -> wordOrderTokens(phrase).map(t -> String.join(" ", t)).orElse("");
            default -> "";
        };
    }

    /** The example sentence with the phrase blanked out, when the example contains the phrase. */
    static Optional<String> clozeBlank(WritingPhrase phrase) {
        String example = phrase.getExample();
        if (example == null || example.isBlank()) return Optional.empty();
        String core = core(phrase.getPhrase());
        if (core.length() < 3) return Optional.empty();
        Matcher m = Pattern.compile(Pattern.quote(core), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(example);
        if (!m.find()) return Optional.empty();
        return Optional.of(example.substring(0, m.start()) + BLANK + example.substring(m.end()));
    }

    /** The example sentence split into words, when it has a sensible length for a puzzle. */
    static Optional<List<String>> wordOrderTokens(WritingPhrase phrase) {
        String example = phrase.getExample();
        if (example == null || example.isBlank()) return Optional.empty();
        List<String> tokens = Arrays.asList(example.strip().split("\\s+"));
        if (tokens.size() < WORD_ORDER_MIN || tokens.size() > WORD_ORDER_MAX) return Optional.empty();
        return Optional.of(tokens);
    }
}
