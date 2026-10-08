package com.deutschbridge.backend.service.examcontent;

import org.springframework.web.util.HtmlUtils;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Text normalisation + trigram similarity for duplicate detection. The measure is the same one
 * PostgreSQL's pg_trgm {@code similarity()} computes (Jaccard over padded character trigrams per word),
 * so the thresholds carry over unchanged if detection is ever moved into the database.
 */
public final class TextSimilarity {

    private TextSimilarity() {
    }

    /** Lower-case, de-accented, punctuation-free, single-spaced - "Straße!" and "strasse" compare equal. */
    public static String normalize(String text) {
        if (text == null) return "";
        // Stored passages are HTML ("B&uuml;cher"), imported ones plain text ("Bücher") - both must normalise alike.
        String stripped = HtmlUtils.htmlUnescape(text.replaceAll("<[^>]*>", " ").replace("&nbsp;", " "));
        String lower = stripped.toLowerCase(Locale.GERMAN).replace("ß", "ss");
        String folded = Normalizer.normalize(lower, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return folded.replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }

    public static Set<String> trigrams(String normalized) {
        Set<String> grams = new HashSet<>();
        if (normalized == null || normalized.isBlank()) return grams;
        for (String word : normalized.split(" ")) {
            String padded = "  " + word + " ";
            for (int i = 0; i + 3 <= padded.length(); i++) {
                grams.add(padded.substring(i, i + 3));
            }
        }
        return grams;
    }

    /** Jaccard similarity of two trigram sets, 0..1. */
    public static double similarity(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        Set<String> smaller = a.size() <= b.size() ? a : b;
        Set<String> larger = smaller == a ? b : a;
        int shared = 0;
        for (String gram : smaller) {
            if (larger.contains(gram)) shared++;
        }
        return (double) shared / (a.size() + b.size() - shared);
    }

    public static double similarity(String a, String b) {
        return similarity(trigrams(normalize(a)), trigrams(normalize(b)));
    }

    public static int wordCount(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }
}
