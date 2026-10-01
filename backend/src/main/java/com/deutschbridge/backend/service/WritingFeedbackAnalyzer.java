package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.WritingFeedback;
import com.deutschbridge.backend.model.dto.WritingFeedback.Dimension;
import com.deutschbridge.backend.model.dto.WritingFeedback.Stats;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rule-based first-pass feedback that needs no AI: task completion (length, Leitpunkte), text
 * structure, vocabulary variety/Redemittel use and formal correctness. It is a transparent heuristic,
 * not a grader - grammar is explicitly reported as "not assessed" until AI feedback exists.
 */
@Component
public class WritingFeedbackAnalyzer {

    static final String GOOD = "GOOD";
    static final String OK = "OK";
    static final String IMPROVE = "IMPROVE";
    static final String NOT_ASSESSED = "NOT_ASSESSED";

    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{M}'-]+");
    private static final Pattern GREETING = Pattern.compile("^(liebe[rs]?|hallo|hi|guten (tag|morgen|abend)|sehr geehrte[rs]?)\\b.*", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLOSING = Pattern.compile("(gr(ü|ue)ß|gruß|tschüss|bis bald|bis dann|mfg|herzlich)", Pattern.CASE_INSENSITIVE);
    private static final Pattern LOWER_AFTER_SENTENCE_END = Pattern.compile("[.!?]\\s+\\p{Ll}");

    private static final Set<String> CONNECTORS = Set.of(
            "weil", "denn", "deshalb", "deswegen", "darum", "außerdem", "aber", "trotzdem", "dass", "obwohl",
            "damit", "sondern", "zuerst", "danach", "dann", "schließlich", "jedoch", "also", "wenn",
            "falls", "während", "bevor", "nachdem", "einerseits", "andererseits", "dennoch", "folglich",
            "daher", "allerdings", "sowohl", "zudem", "ferner", "insgesamt");
    private static final Set<String> STOPWORDS = Set.of(
            "sie", "können", "könnten", "möchten", "möchte", "warum", "wann", "wieso", "weshalb", "welche", "welcher",
            "welches", "wollen", "würden", "wurde", "wurden", "haben", "sollen", "schreiben", "etwas", "dazu", "wird",
            "werden", "über", "nicht", "oder", "nach", "sich", "euch", "dein", "deine", "ihre", "ihren", "ihrer",
            "ihnen", "eine", "einen", "einem", "einer", "diese", "dieser", "dieses", "dabei", "eigene", "eigenen");

    private record LevelTargets(int minWords, int connectors) {
    }

    private static LevelTargets targets(LearningLevel level) {
        // Conservative, level-scaled guidance values - not official exam rules.
        return switch (level) {
            case A1, A2 -> new LevelTargets(40, 2);
            case B1 -> new LevelTargets(80, 3);
            case B2 -> new LevelTargets(150, 4);
            case C1 -> new LevelTargets(200, 5);
            case C2 -> new LevelTargets(250, 6);
        };
    }

    public WritingFeedback analyze(String text, LearningLevel level, List<String> leitpunkte, List<String> levelPhrases) {
        LevelTargets target = targets(level != null ? level : LearningLevel.B1);
        String norm = text.strip();
        String lower = norm.toLowerCase(Locale.GERMAN);
        List<String> words = words(norm);
        int wordCount = words.size();
        List<String> lines = Arrays.stream(norm.split("\\R")).map(String::strip).filter(l -> !l.isEmpty()).toList();
        int paragraphs = norm.split("\\R\\s*\\R").length;
        int sentences = Math.max(1, (int) Arrays.stream(norm.split("[.!?]+")).filter(s -> !s.isBlank()).count());

        Set<String> connectorsUsed = new TreeSet<>();
        for (String w : words) {
            String lw = w.toLowerCase(Locale.GERMAN);
            if (CONNECTORS.contains(lw)) connectorsUsed.add(lw);
        }
        if (lower.contains("zum beispiel")) connectorsUsed.add("zum Beispiel");

        List<String> uncovered = uncoveredLeitpunkte(lower, leitpunkte);
        List<String> usedPhrases = usedPhrases(lower, levelPhrases);

        List<Dimension> dims = List.of(
                taskDimension(wordCount, target, leitpunkte, uncovered),
                structureDimension(lines, paragraphs, connectorsUsed.size(), target, sentences, wordCount, lower),
                languageDimension(),
                vocabularyDimension(words, usedPhrases),
                formDimension(norm, lines));

        List<String> highlights = new ArrayList<>();
        dims.forEach(d -> highlights.addAll(d.positives()));
        List<String> focus = new ArrayList<>();
        dims.forEach(d -> d.improvements().stream().findFirst().filter(i -> !NOT_ASSESSED.equals(d.status())).ifPresent(focus::add));

        return new WritingFeedback("RULES", dims, limit(highlights, 4), limit(focus, 3),
                new Stats(wordCount, sentences, paragraphs, connectorsUsed.size(), usedPhrases, uncovered));
    }

    // ---- dimensions ----

    private Dimension taskDimension(int wordCount, LevelTargets target, List<String> leitpunkte, List<String> uncovered) {
        List<String> pos = new ArrayList<>();
        List<String> imp = new ArrayList<>();
        if (wordCount >= target.minWords()) {
            pos.add("Dein Text hat eine passende Länge (" + wordCount + " Wörter).");
        } else {
            imp.add("Dein Text ist mit " + wordCount + " Wörtern eher kurz. Für dieses Niveau sind etwa " + target.minWords()
                    + " Wörter sinnvoll – bearbeite jeden Leitpunkt mit Begründung oder Detail.");
        }
        if (!leitpunkte.isEmpty()) {
            if (uncovered.isEmpty()) {
                pos.add("Alle Leitpunkte scheinen bearbeitet zu sein.");
            } else {
                for (String u : uncovered) {
                    imp.add("Prüfe, ob du diesen Leitpunkt klar beantwortet hast: „" + u + "“");
                }
            }
        }
        return new Dimension("TASK", "Aufgabenbewältigung", status(pos, imp), pos, imp);
    }

    private Dimension structureDimension(List<String> lines, int paragraphs, int connectors, LevelTargets target,
                                         int sentences, int wordCount, String lower) {
        List<String> pos = new ArrayList<>();
        List<String> imp = new ArrayList<>();
        String first = lines.isEmpty() ? "" : lines.get(0);
        boolean greeting = GREETING.matcher(first).matches();
        if (greeting) pos.add("Du beginnst mit einer Anrede."); else imp.add("Beginne mit einer passenden Anrede, z. B. „Liebe Anna,“ oder „Sehr geehrte Frau Müller,“.");

        String tail = String.join(" ", lines.subList(Math.max(0, lines.size() - 3), lines.size()));
        if (CLOSING.matcher(tail).find()) pos.add("Du schließt mit einer Grußformel."); else imp.add("Schließe mit einem Schlusssatz und einer Grußformel, z. B. „Liebe Grüße“ oder „Mit freundlichen Grüßen“.");

        if (connectors >= target.connectors()) {
            pos.add("Du verbindest deine Gedanken mit Verbindungswörtern (" + connectors + " verschiedene).");
        } else {
            imp.add("Nutze mehr Verbindungswörter wie weil, deshalb, außerdem oder aber, um deine Sätze zu verbinden.");
        }
        if (paragraphs >= 3) pos.add("Dein Text ist in Absätze gegliedert."); else if (wordCount > 40) imp.add("Gliedere deinen Text in Absätze – ein Absatz pro Leitpunkt hilft dem Leser.");

        double avg = (double) wordCount / sentences;
        if (avg > 25) imp.add("Deine Sätze sind sehr lang. Teile sie auf, damit sie leichter verständlich sind.");
        else if (avg < 5 && wordCount > 15) imp.add("Viele Sätze sind sehr kurz. Verbinde sie zu längeren Sätzen.");

        if (first.toLowerCase(Locale.GERMAN).startsWith("sehr geehrte") && Pattern.compile("\\b(du|dich|dir|dein\\w*)\\b").matcher(lower).find()) {
            imp.add("Du beginnst formell („Sehr geehrte …“), schreibst aber im Text „du“. Bleibe bei „Sie“.");
        } else if (Pattern.compile("^hallo (frau|herr)\\b", Pattern.CASE_INSENSITIVE).matcher(first).find()) {
            imp.add("Bei „Frau/Herr“ passt die formelle Anrede „Sehr geehrte Frau …“ / „Sehr geehrter Herr …“.");
        }
        return new Dimension("STRUCTURE", "Textaufbau", status(pos, imp), pos, imp);
    }

    private Dimension languageDimension() {
        List<String> imp = List.of("Grammatik wird in dieser automatischen Analyse noch nicht geprüft. Kontrolliere selbst: Verbposition (besonders nach „weil“ und „dass“), Artikel und Endungen, Präpositionen und Rechtschreibung.");
        return new Dimension("LANGUAGE", "Sprache", NOT_ASSESSED, List.of(), imp);
    }

    private Dimension vocabularyDimension(List<String> words, List<String> usedPhrases) {
        List<String> pos = new ArrayList<>();
        List<String> imp = new ArrayList<>();
        if (!usedPhrases.isEmpty()) {
            pos.add("Du verwendest passende Redemittel: " + String.join(", ", limit(usedPhrases, 3)) + ".");
        } else if (words.size() > 20) {
            imp.add("Versuche, ein paar passende Redemittel einzubauen (siehe „Schreiben lernen → Redemittel“).");
        }
        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) {
            String lw = w.toLowerCase(Locale.GERMAN);
            if (lw.length() >= 5 && !STOPWORDS.contains(lw)) counts.merge(lw, 1, Integer::sum);
        }
        List<String> repeated = counts.entrySet().stream().filter(e -> e.getValue() >= 4)
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()).limit(3)
                .map(e -> "„" + e.getKey() + "“ (" + e.getValue() + "×)").toList();
        if (!repeated.isEmpty()) imp.add("Du wiederholst einige Wörter oft: " + String.join(", ", repeated) + ". Suche Alternativen oder Pronomen.");
        else if (words.size() >= 40) pos.add("Dein Wortschatz ist abwechslungsreich – du wiederholst kaum Wörter.");
        return new Dimension("VOCABULARY", "Wortschatz", status(pos, imp), pos, imp);
    }

    private Dimension formDimension(String text, List<String> lines) {
        List<String> pos = new ArrayList<>();
        List<String> imp = new ArrayList<>();
        Matcher m = LOWER_AFTER_SENTENCE_END.matcher(text);
        int lowerStarts = 0;
        while (m.find()) lowerStarts++;
        if (lowerStarts > 0) imp.add("Nach einem Satzende beginnt ein neuer Satz mit Großbuchstaben (" + lowerStarts + "× klein geschrieben).");
        if (!lines.isEmpty() && Character.isLowerCase(lines.get(0).charAt(0))) imp.add("Der Text beginnt mit einem Kleinbuchstaben.");
        if (text.contains("  ")) imp.add("Du hast doppelte Leerzeichen im Text.");
        char last = text.charAt(text.length() - 1);
        boolean endsFine = ".!?,".indexOf(last) >= 0 || lines.size() > 1;
        if (!endsFine) imp.add("Beende deinen Text mit einem Satzzeichen.");
        if (imp.isEmpty()) pos.add("Groß-/Kleinschreibung und Satzzeichen wirken sauber.");
        return new Dimension("FORM", "Formale Korrektheit", status(pos, imp), pos, imp);
    }

    // ---- helpers ----

    private static String status(List<String> pos, List<String> imp) {
        if (imp.isEmpty()) return GOOD;
        return pos.size() >= imp.size() ? OK : IMPROVE;
    }

    private static List<String> words(String text) {
        List<String> out = new ArrayList<>();
        Matcher m = WORD.matcher(text);
        while (m.find()) out.add(m.group());
        return out;
    }

    private static List<String> uncoveredLeitpunkte(String lowerText, List<String> leitpunkte) {
        Set<String> textPrefixes = new HashSet<>();
        for (String w : words(lowerText)) textPrefixes.add(prefix(w));
        List<String> uncovered = new ArrayList<>();
        for (String lp : leitpunkte) {
            List<String> tokens = words(lp.toLowerCase(Locale.GERMAN)).stream()
                    .filter(w -> w.length() >= 5 && !STOPWORDS.contains(w)).distinct().toList();
            if (tokens.isEmpty()) continue; // nothing reliable to match on
            long hits = tokens.stream().filter(t -> textPrefixes.contains(prefix(t))).count();
            long needed = tokens.size() <= 2 ? 1 : (long) Math.ceil(tokens.size() / 3.0);
            if (hits < needed) uncovered.add(lp);
        }
        return uncovered;
    }

    private static String prefix(String w) {
        return w.length() <= 5 ? w : w.substring(0, 5);
    }

    private static List<String> usedPhrases(String lowerText, List<String> phrases) {
        Set<String> used = new LinkedHashSet<>();
        for (String phrase : phrases) {
            for (String chunk : phrase.split("[/…,]")) {
                String c = chunk.strip().replaceAll("[.!?]+$", "").toLowerCase(Locale.GERMAN);
                if (c.length() >= 6 && lowerText.contains(c)) {
                    used.add(chunk.strip().replaceAll("[.!?]+$", ""));
                    break;
                }
            }
        }
        return new ArrayList<>(used);
    }

    private static <T> List<T> limit(List<T> list, int n) {
        return list.size() <= n ? list : list.subList(0, n);
    }
}
