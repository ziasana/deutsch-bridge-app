package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.error;
import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.warning;

/**
 * Reads and validates a DTZ Lesen Teil 2 exercise ("Anzeigen zuordnen"): five situations (26-30), eight advertisements (a-h),
 * an answer key with exactly four distinct advertisement answers and exactly one X, and an optional unscored example.
 *
 * Structural rules are errors (they block the import). Whether the texts really support the answer key cannot be proven by a
 * program, so the checks on meaning only produce warnings and the admin has to review the preview.
 */
final class ExamAdMatchingReader {

    static final String EXERCISE_TYPE = "ADVERTISEMENT_MATCHING";
    static final String SKILL = "ANZEIGEN_ZUORDNEN";
    static final Set<String> LANGUAGE_LEVELS = Set.of("A2", "A2_B1", "B1");
    static final String NO_AD = "X";

    static final int MAX_SITUATION = 500;
    static final int MAX_TITLE = 150;
    static final int MAX_BODY = 1200;
    static final int MAX_EXPLANATION = 1000;
    static final int MIN_AD_WORDS = 12;
    static final int LONG_SITUATION_WORDS = 40;
    static final int LONG_AD_WORDS = 160;
    static final double SIMILAR_AD_THRESHOLD = 0.6;

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> SITUATION_CODES = Set.of("SITUATIONS_MISSING", "SITUATION_COUNT", "SITUATION_NUMBER_INVALID",
            "SITUATION_NUMBER_DUPLICATE", "SITUATION_NUMBERS", "SITUATION_TEXT_EMPTY", "SITUATION_TEXT_TOO_LONG", "EXERCISE_TYPE_INVALID");
    static final Set<String> AD_CODES = Set.of("ADVERTISEMENTS_MISSING", "AD_COUNT", "AD_LABEL_MISSING", "AD_LABEL_DUPLICATE", "AD_LABELS",
            "AD_TITLE_MISSING", "AD_TITLE_TOO_LONG", "AD_BODY_MISSING", "AD_BODY_TOO_LONG", "HTML_CONTENT");
    static final Set<String> ANSWER_CODES = Set.of("ANSWER_KEY_MISSING", "ANSWER_KEY_COUNT", "ANSWER_NUMBER_INVALID", "ANSWER_NUMBER_UNKNOWN",
            "ANSWER_NUMBER_DUPLICATE", "ANSWER_MISSING", "ANSWER_UNKNOWN_AD", "NO_ANSWER_COUNT", "AD_ANSWER_COUNT", "AD_REUSED", "SITUATION_WITHOUT_ANSWER");
    static final Set<String> EXPLANATION_CODES = Set.of("EXPLANATION_MISSING");
    static final Set<String> EXAMPLE_CODES = Set.of("EXAMPLE_INVALID", "EXAMPLE_SITUATION_EMPTY", "EXAMPLE_ANSWER", "EXAMPLE_EXPLANATION_MISSING");

    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern BULLET = Pattern.compile("^\\s*[-•*–]\\s+");
    private static final Pattern AD_REFERENCE = Pattern.compile("\\bAnzeige\\s+([a-h])\\b", Pattern.CASE_INSENSITIVE);
    private static final Set<String> STOP_WORDS = Set.of("sie", "ihre", "ihren", "ihrem", "ihrer", "ihr", "ein", "eine", "einen", "einem", "einer",
            "und", "oder", "aber", "für", "mit", "bei", "nach", "von", "aus", "auf", "den", "dem", "der", "die", "das", "des", "ist", "sind", "sich",
            "möchten", "möchte", "suchen", "brauchen", "wollen", "gern", "auch", "nur", "noch", "sehr", "wir", "uns", "ihnen");

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamAdMatchingReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** The scored situations (with answer and German explanation), the advertisements and what is kept in the exercise metadata. */
    record Result(List<ParsedExercise.Situation> situations, List<ParsedExercise.Advertisement> advertisements, Map<String, Object> metadata) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        checkHeader(node);
        List<ParsedExercise.Advertisement> ads = readAdvertisements(spec, node);
        List<ParsedExercise.Situation> situations = readSituations(spec, node);
        Map<String, Object> metadata = new LinkedHashMap<>();
        String topic = collect(text(node, "topic"));
        if (topic != null) metadata.put("topic", topic);
        metadata.put("difficulty", readLanguageLevel(node));

        List<ParsedExercise.Situation> keyed = applyAnswerKey(spec, node, situations, ads);
        Map<String, Object> example = readExample(spec, node);
        if (example != null) metadata.put("example", example);

        rejectMarkup();
        warnContent(keyed, ads);
        return new Result(keyed, ads, metadata);
    }

    // ------------------------------------------------------------------ header

    private void checkHeader(JsonNode node) {
        String exerciseType = text(node, "exerciseType");
        if (exerciseType != null && !EXERCISE_TYPE.equals(exerciseType.toUpperCase(Locale.ROOT))) {
            issues.add(error("EXERCISE_TYPE_INVALID", p + "exerciseType", "exerciseType must be " + EXERCISE_TYPE + " (found: " + exerciseType + ")."));
        }
        String skill = text(node, "skill");
        if (skill != null && !SKILL.equals(skill.toUpperCase(Locale.ROOT))) {
            issues.add(warning("SKILL_UNEXPECTED", p + "skill", "skill is normally " + SKILL + " (found: " + skill + ")."));
        }
    }

    private String readLanguageLevel(JsonNode node) {
        String difficulty = text(node, "difficulty");
        if (difficulty == null) return "A2_B1";
        String normalized = difficulty.toUpperCase(Locale.ROOT).replaceAll("[-– ]", "_");
        if (!LANGUAGE_LEVELS.contains(normalized)) {
            issues.add(warning("DIFFICULTY_UNKNOWN", p + "difficulty", "Unknown difficulty '" + difficulty + "' (use A2, A2_B1 or B1); A2_B1 is used."));
            return "A2_B1";
        }
        return normalized;
    }

    // ------------------------------------------------------------------ advertisements

    private List<ParsedExercise.Advertisement> readAdvertisements(ExamContentSpec spec, JsonNode node) {
        List<ParsedExercise.Advertisement> ads = new ArrayList<>();
        JsonNode array = node.get("advertisements");
        if (array == null || !array.isArray()) {
            issues.add(error("ADVERTISEMENTS_MISSING", p + "advertisements", "advertisements must be an array."));
            return ads;
        }
        Set<String> labels = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode a = array.get(i);
            String path = p + "advertisements[" + i + "]";
            String label = firstNonNull(text(a, "label"), text(a, "id"));
            if (label == null) {
                issues.add(error("AD_LABEL_MISSING", path + ".label", "Advertisement " + (i + 1) + " has no label."));
            } else {
                label = label.toLowerCase(Locale.ROOT);
                if (!labels.add(label)) issues.add(error("AD_LABEL_DUPLICATE", path + ".label", "Advertisement label '" + label + "' is used more than once."));
            }
            String title = collect(text(a, "title"));
            if (title == null) {
                issues.add(error("AD_TITLE_MISSING", path + ".title", "Advertisement '" + label + "' has no title."));
            } else if (title.length() > MAX_TITLE) {
                issues.add(error("AD_TITLE_TOO_LONG", path + ".title", "The title of advertisement '" + label + "' is longer than " + MAX_TITLE + " characters."));
            }
            String body = collect(text(a, "body"));
            if (body == null) {
                issues.add(error("AD_BODY_MISSING", path + ".body", "Advertisement '" + label + "' has no body."));
            } else if (body.length() > MAX_BODY) {
                issues.add(error("AD_BODY_TOO_LONG", path + ".body", "The body of advertisement '" + label + "' is longer than " + MAX_BODY + " characters."));
            }
            String category = collect(text(a, "category"));
            if (category == null) {
                issues.add(warning("AD_CATEGORY_MISSING", path + ".category", "Advertisement '" + label + "' has no category."));
            } else {
                category = category.toUpperCase(Locale.ROOT);
            }
            ads.add(new ParsedExercise.Advertisement(label, category, null, adContent(title, body), Map.of(), Map.of()));
        }
        if (ads.size() != spec.advertisementCount()) {
            issues.add(error("AD_COUNT", p + "advertisements", "Exactly " + spec.advertisementCount() + " advertisements are required (found " + ads.size() + ")."));
        }
        if (!labels.isEmpty() && labels.size() == ads.size() && !labels.equals(new LinkedHashSet<>(spec.optionIds()))) {
            issues.add(error("AD_LABELS", p + "advertisements", "Advertisement labels must be exactly " + String.join(", ", spec.optionIds()) + "."));
        }
        return ads;
    }

    /**
     * The learner view of an advertisement: the title is the headline, bullet lines of the body are details and the remaining lines the
     * description. The original body is kept ({@code body}) so the advertisement can be exported unchanged.
     */
    static Map<String, Object> adContent(String title, String body) {
        Map<String, Object> content = new LinkedHashMap<>();
        if (title != null) content.put("headline", title);
        if (body != null) {
            List<String> description = new ArrayList<>();
            List<String> details = new ArrayList<>();
            for (String line : body.split("\\R")) {
                String trimmed = line.strip();
                if (trimmed.isEmpty()) continue;
                Matcher bullet = BULLET.matcher(trimmed);
                if (bullet.find()) details.add(trimmed.substring(bullet.end()).strip());
                else description.add(trimmed);
            }
            if (!description.isEmpty()) content.put("description", String.join(" ", description));
            if (!details.isEmpty()) content.put("details", details);
            content.put("body", body);
        }
        return content;
    }

    // ------------------------------------------------------------------ situations

    private List<ParsedExercise.Situation> readSituations(ExamContentSpec spec, JsonNode node) {
        List<ParsedExercise.Situation> situations = new ArrayList<>();
        JsonNode array = node.get("situations");
        if (array == null || !array.isArray()) {
            issues.add(error("SITUATIONS_MISSING", p + "situations", "situations must be an array."));
            return situations;
        }
        Set<Integer> numbers = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode s = array.get(i);
            String path = p + "situations[" + i + "]";
            Integer number = null;
            JsonNode numberNode = s == null ? null : s.get("number");
            if (numberNode != null && numberNode.isIntegralNumber()) {
                number = numberNode.asInt();
                if (!numbers.add(number)) issues.add(error("SITUATION_NUMBER_DUPLICATE", path + ".number", "Situation number " + number + " is used more than once."));
            } else {
                issues.add(error("SITUATION_NUMBER_INVALID", path + ".number", "Situation " + (i + 1) + " needs a whole-number 'number' ("
                        + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + ")."));
            }
            String text = collect(text(s, "text"));
            if (text == null) {
                issues.add(error("SITUATION_TEXT_EMPTY", path + ".text", "Situation " + (number != null ? number : i + 1) + " has no text."));
            } else if (text.length() > MAX_SITUATION) {
                issues.add(error("SITUATION_TEXT_TOO_LONG", path + ".text", "Situation " + (number != null ? number : i + 1) + " is longer than " + MAX_SITUATION + " characters."));
            }
            situations.add(new ParsedExercise.Situation("situation_" + (number != null ? number : spec.firstQuestionNumber() + i), number, text, null, Map.of()));
        }
        if (situations.size() != spec.situationCount()) {
            issues.add(error("SITUATION_COUNT", p + "situations", "Exactly " + spec.situationCount() + " situations are required (found " + situations.size() + ")."));
        }
        List<Integer> expected = java.util.stream.IntStream.rangeClosed(spec.firstQuestionNumber(), spec.lastQuestionNumber()).boxed().toList();
        if (!numbers.isEmpty() && !numbers.equals(new LinkedHashSet<>(expected))) {
            issues.add(error("SITUATION_NUMBERS", p + "situations", "Situation numbers must be exactly " + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber()
                    + " (found: " + numbers.stream().sorted().map(String::valueOf).collect(java.util.stream.Collectors.joining(", ")) + ")."));
        }
        return situations;
    }

    // ------------------------------------------------------------------ answer key

    /** Joins the answer key to the situations and checks the matching rules (one X, four distinct advertisements, no reuse). */
    private List<ParsedExercise.Situation> applyAnswerKey(ExamContentSpec spec, JsonNode node, List<ParsedExercise.Situation> situations,
                                                         List<ParsedExercise.Advertisement> ads) {
        JsonNode array = node.get("answerKey");
        if (array == null || !array.isArray()) {
            issues.add(error("ANSWER_KEY_MISSING", p + "answerKey", "answerKey must be an array."));
            return situations;
        }
        if (array.size() != spec.situationCount()) {
            issues.add(error("ANSWER_KEY_COUNT", p + "answerKey", "Exactly " + spec.situationCount() + " answer-key entries are required (found " + array.size() + ")."));
        }
        Set<String> adLabels = new HashSet<>();
        ads.forEach(a -> adLabels.add(a.id()));
        Map<Integer, ParsedExercise.Situation> byNumber = new LinkedHashMap<>();
        situations.forEach(s -> {
            if (s.number() != null) byNumber.put(s.number(), s);
        });

        Map<Integer, String> answers = new LinkedHashMap<>();
        Map<Integer, Map<String, String>> explanations = new LinkedHashMap<>();
        Map<String, List<Integer>> usedBy = new LinkedHashMap<>();
        int none = 0;
        for (int i = 0; i < array.size(); i++) {
            JsonNode entry = array.get(i);
            String path = p + "answerKey[" + i + "]";
            JsonNode numberNode = entry == null ? null : entry.get("questionNumber");
            Integer number = numberNode != null && numberNode.isIntegralNumber() ? numberNode.asInt() : null;
            if (number == null) {
                issues.add(error("ANSWER_NUMBER_INVALID", path + ".questionNumber", "Answer-key entry " + (i + 1) + " needs a whole-number questionNumber."));
                continue;
            }
            if (!byNumber.containsKey(number)) {
                issues.add(error("ANSWER_NUMBER_UNKNOWN", path + ".questionNumber", "questionNumber " + number + " does not belong to any situation."));
                continue;
            }
            if (answers.containsKey(number)) {
                issues.add(error("ANSWER_NUMBER_DUPLICATE", path + ".questionNumber", "Question " + number + " has more than one answer-key entry."));
                continue;
            }
            String raw = text(entry, "correctAnswer");
            if (raw == null) {
                issues.add(error("ANSWER_MISSING", path + ".correctAnswer", "Question " + number + " has no correctAnswer."));
                continue;
            }
            String answer = raw.trim().toLowerCase(Locale.ROOT);
            if (answer.equals(NO_AD.toLowerCase(Locale.ROOT))) {
                none++;
                answers.put(number, ExamContentValidator.NO_ADVERTISEMENT);
            } else if (!adLabels.contains(answer)) {
                issues.add(error("ANSWER_UNKNOWN_AD", path + ".correctAnswer", "Question " + number + " refers to advertisement '" + raw
                        + "', which does not exist (use " + String.join(", ", spec.optionIds()) + " or X)."));
                continue;
            } else {
                answers.put(number, answer);
                usedBy.computeIfAbsent(answer, k -> new ArrayList<>()).add(number);
            }
            explanations.put(number, readExplanation(entry == null ? null : entry.get("explanation"), path, number));
        }
        usedBy.forEach((label, numbers) -> {
            if (numbers.size() > 1) {
                issues.add(error("AD_REUSED", p + "answerKey", "Advertisement \"" + label + "\" is the correct answer for more than one situation: "
                        + numbers.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(" and ")) + "."));
            }
        });
        for (ParsedExercise.Situation s : situations) {
            if (s.number() != null && !answers.containsKey(s.number()) && array.size() == spec.situationCount()) {
                issues.add(error("SITUATION_WITHOUT_ANSWER", p + "answerKey", "Situation " + s.number() + " has no answer-key entry."));
            }
        }
        if (array.size() == spec.situationCount() && none != 1) {
            issues.add(error("NO_ANSWER_COUNT", p + "answerKey", "Exactly one situation must have the answer X (found " + none + ")."));
        }
        if (array.size() == spec.situationCount() && usedBy.size() != spec.situationCount() - 1 && none == 1) {
            issues.add(error("AD_ANSWER_COUNT", p + "answerKey", "Exactly " + (spec.situationCount() - 1) + " distinct advertisements must be correct answers (found " + usedBy.size() + ")."));
        }

        List<ParsedExercise.Situation> result = new ArrayList<>();
        for (ParsedExercise.Situation s : situations) {
            result.add(new ParsedExercise.Situation(s.id(), s.number(), s.text(), s.number() == null ? null : answers.get(s.number()), Map.of(),
                    s.number() == null ? Map.of() : explanations.getOrDefault(s.number(), Map.of())));
        }
        return result;
    }

    /** explanation is {"de": ...}; a plain string is taken as the German one. Other languages are not used and are ignored. */
    private Map<String, String> readExplanation(JsonNode node, String path, Integer number) {
        Map<String, String> out = new LinkedHashMap<>();
        String value = null;
        if (node != null && node.isTextual()) value = collect(node.asText().isBlank() ? null : node.asText().strip());
        else if (node != null && node.isObject()) value = collect(text(node, "de"));
        if (value == null) {
            issues.add(error("EXPLANATION_MISSING", path + ".explanation", "Question " + number + " needs a German explanation (explanation.de)."));
        } else {
            out.put("de", value.length() > MAX_EXPLANATION ? value.substring(0, MAX_EXPLANATION) : value);
        }
        return out;
    }

    // ------------------------------------------------------------------ example

    /** The unscored example; absent or {"enabled": false} means there is none. */
    private Map<String, Object> readExample(ExamContentSpec spec, JsonNode node) {
        JsonNode example = node.get("example");
        if (example == null || example.isNull()) return null;
        String ep = p + "example";
        if (!example.isObject() || !example.has("enabled") || !example.get("enabled").isBoolean()) {
            issues.add(error("EXAMPLE_INVALID", ep, "example must be an object with a boolean 'enabled' (use {\"enabled\": false} for no example)."));
            return null;
        }
        if (!example.get("enabled").asBoolean()) return null;

        String situation = collect(text(example, "situation"));
        if (situation == null) issues.add(error("EXAMPLE_SITUATION_EMPTY", ep + ".situation", "The example needs a situation."));
        String answer = text(example, "correctAnswer");
        String normalized = answer == null ? null : answer.trim().toLowerCase(Locale.ROOT);
        if (normalized == null || !(normalized.equals("x") || spec.optionIds().contains(normalized))) {
            issues.add(error("EXAMPLE_ANSWER", ep + ".correctAnswer", "The example's correctAnswer must be one of " + String.join(", ", spec.optionIds()) + " or X."));
        }
        Map<String, String> explanation = new LinkedHashMap<>();
        JsonNode explanationNode = example.get("explanation");
        String de = explanationNode == null ? null
                : explanationNode.isTextual() ? collect(explanationNode.asText().isBlank() ? null : explanationNode.asText().strip())
                : collect(text(explanationNode, "de"));
        if (de == null) issues.add(error("EXAMPLE_EXPLANATION_MISSING", ep + ".explanation", "The example needs a German explanation."));
        else explanation.put("de", de.length() > MAX_EXPLANATION ? de.substring(0, MAX_EXPLANATION) : de);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("situation", situation);
        out.put("correctAnswer", normalized == null ? null : normalized.equals("x") ? "X" : normalized);
        out.put("explanation", explanation);
        return out;
    }

    // ------------------------------------------------------------------ warnings (heuristics, never blocking)

    private void warnContent(List<ParsedExercise.Situation> situations, List<ParsedExercise.Advertisement> ads) {
        issues.add(warning("SEMANTIC_REVIEW_NEEDED", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                "The structure is valid, but whether each situation has exactly one suitable advertisement (and the X situation none) cannot be checked automatically. Review it in the preview."));
        Map<String, String> adText = new LinkedHashMap<>();
        for (ParsedExercise.Advertisement ad : ads) {
            adText.put(ad.id(), AdvertisementRenderer.toPlainText(ad.content()));
        }
        for (ParsedExercise.Advertisement ad : ads) {
            String body = string(ad.content().get("body"));
            int words = body == null ? 0 : TextSimilarity.wordCount(body);
            if (body != null && words < MIN_AD_WORDS) {
                issues.add(warning("AD_TOO_SHORT", p + "advertisements", "Advertisement '" + ad.id() + "' has only " + words + " words; it may lack the information needed for matching."));
            } else if (words > LONG_AD_WORDS) {
                issues.add(warning("AD_TOO_LONG", p + "advertisements", "Advertisement '" + ad.id() + "' has more than " + LONG_AD_WORDS + " words; it may be too hard to read at A2–B1."));
            }
        }
        List<String> labels = new ArrayList<>(adText.keySet());
        for (int i = 0; i < labels.size(); i++) {
            for (int j = i + 1; j < labels.size(); j++) {
                if (TextSimilarity.similarity(adText.get(labels.get(i)), adText.get(labels.get(j))) >= SIMILAR_AD_THRESHOLD) {
                    issues.add(warning("AD_SIMILAR", p + "advertisements", "Advertisements '" + labels.get(i) + "' and '" + labels.get(j) + "' are very similar."));
                }
            }
        }
        for (ParsedExercise.Situation s : situations) {
            if (s.text() == null || s.number() == null) continue;
            if (TextSimilarity.wordCount(s.text()) > LONG_SITUATION_WORDS) {
                issues.add(warning("SITUATION_LONG", p + "situations", "Situation " + s.number() + " has more than " + LONG_SITUATION_WORDS + " words; the language level may be too difficult."));
            }
            warnMatching(s, adText);
            warnExplanation(s);
        }
    }

    /** Word-overlap heuristic: a situation whose words also appear in a second advertisement (or in any, for X) may be ambiguous. */
    private void warnMatching(ParsedExercise.Situation s, Map<String, String> adText) {
        if (s.correctAdvertisementId() == null) return;
        Set<String> words = contentWords(s.text());
        if (words.size() < 3) return;
        Map<String, Integer> overlap = new LinkedHashMap<>();
        adText.forEach((label, text) -> {
            Set<String> shared = new HashSet<>(words);
            shared.retainAll(contentWords(text));
            overlap.put(label, shared.size());
        });
        boolean none = ExamContentValidator.NO_ADVERTISEMENT.equals(s.correctAdvertisementId());
        int own = none ? 0 : overlap.getOrDefault(s.correctAdvertisementId(), 0);
        for (Map.Entry<String, Integer> e : overlap.entrySet()) {
            if (e.getKey().equals(s.correctAdvertisementId())) continue;
            if (none && e.getValue() >= 3 && e.getValue() >= words.size() * 0.4) {
                issues.add(warning("X_MAYBE_SOLVABLE", p + "situations", "Situation " + s.number() + " has the answer X, but advertisement '" + e.getKey()
                        + "' shares many words with it — check that it really does not fit."));
            } else if (!none && e.getValue() >= 2 && e.getValue() >= own) {
                issues.add(warning("SITUATION_AMBIGUOUS", p + "situations", "Situation " + s.number() + " may also match advertisement '" + e.getKey()
                        + "' (as many shared words as the correct advertisement)."));
            }
        }
    }

    /** An explanation that names advertisements, but not the one the answer key gives, probably contradicts it. */
    private void warnExplanation(ParsedExercise.Situation s) {
        String de = s.explanation().get("de");
        String answer = s.correctAdvertisementId();
        if (de == null || answer == null || ExamContentValidator.NO_ADVERTISEMENT.equals(answer)) return;
        Set<String> named = new LinkedHashSet<>();
        Matcher m = AD_REFERENCE.matcher(de);
        while (m.find()) named.add(m.group(1).toLowerCase(Locale.ROOT));
        if (!named.isEmpty() && !named.contains(answer)) {
            issues.add(warning("EXPLANATION_CONTRADICTS", p + "answerKey", "The answer for question " + s.number() + " is '" + answer
                    + "', but its explanation only names advertisement " + String.join(", ", named) + "."));
        }
    }

    private static Set<String> contentWords(String text) {
        Set<String> words = new LinkedHashSet<>();
        for (String w : TextSimilarity.normalize(text).split("\\s+")) {
            if (w.length() >= 5 && !STOP_WORDS.contains(w)) words.add(w);
        }
        return words;
    }

    // ------------------------------------------------------------------ helpers

    private String collect(String value) {
        if (value != null) strings.add(value);
        return value;
    }

    private void rejectMarkup() {
        for (String value : strings) {
            if (MARKUP.matcher(value).find()) {
                issues.add(error("HTML_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "Content must be plain text — HTML/script was found in: \"" + (value.length() > 60 ? value.substring(0, 60) + "…" : value) + "\"."));
                return;
            }
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isValueNode()) return null;
        String s = value.asText();
        return s.isBlank() ? null : s.trim();
    }

    private static String string(Object value) {
        if (value == null) return null;
        String s = value.toString().strip();
        return s.isEmpty() ? null : s;
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }
}
