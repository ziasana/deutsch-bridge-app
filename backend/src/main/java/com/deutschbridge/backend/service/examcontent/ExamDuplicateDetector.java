package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.DuplicateMatch;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.enums.ExamType;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Finds exact and near-duplicate content before import: same external id, same set of texts
 * (fingerprint), or individual texts whose trigram similarity to an existing text is high.
 * Existing exercises and the exercises earlier in the same file are both searched.
 */
public class ExamDuplicateDetector {

    /** Trigram similarity from which two texts are reported as "similar". */
    public static final double SIMILAR_THRESHOLD = 0.5;
    private static final int MAX_MATCHES = 5;

    public record Entry(String raw, Set<String> grams) {
    }

    public record Candidate(String id, String title, String externalId, ExamType examType, String hash,
                            List<Entry> texts, boolean fromFile) {

        public static Candidate of(ExamExercise e) {
            List<Entry> entries = new ArrayList<>();
            if (e.getPassages() != null) {
                for (ExamPassage p : e.getPassages()) {
                    // Stored passages are HTML; compare and show them as plain text.
                    entries.add(entry(ExamContentMapper.toPlainText(p.getContent())));
                }
            }
            String hash = e.getContentHash() != null ? e.getContentHash() : ExamContentFingerprint.hash(e.getPassages());
            return new Candidate(e.getId(), e.getTitle(), e.getExternalId(), e.getExamType(), hash, entries, false);
        }

        public static Candidate of(ParsedExercise ex, ExamType examType, String hash) {
            List<Entry> entries = ex.texts().stream().map(t -> entry(t.content())).toList();
            return new Candidate(null, ex.title(), ex.externalId(), examType, hash, entries, true);
        }
    }

    private static Entry entry(String raw) {
        return new Entry(raw == null ? "" : raw, TextSimilarity.trigrams(TextSimilarity.normalize(raw)));
    }

    public List<DuplicateMatch> detect(ParsedExercise exercise, ExamType examType, String hash, List<Candidate> candidates) {
        List<DuplicateMatch> matches = new ArrayList<>();
        List<DuplicateMatch> similar = new ArrayList<>();

        for (Candidate c : candidates) {
            String where = c.fromFile() ? "BATCH_" : "";
            if (exercise.externalId() != null && !c.fromFile() && c.examType() == examType
                    && exercise.externalId().equals(c.externalId())) {
                matches.add(new DuplicateMatch("EXTERNAL_ID", null, null, c.id(), c.title(), c.externalId(), 1.0));
            }
            if (hash != null && hash.equals(c.hash())) {
                matches.add(new DuplicateMatch(where + "EXACT", null, null, c.id(), c.title(), c.externalId(), 1.0));
                continue;
            }
            for (ParsedExercise.Text text : exercise.texts()) {
                if (text.content() == null) continue;
                Entry mine = entry(text.content());
                Entry best = null;
                double bestScore = 0;
                for (Entry theirs : c.texts()) {
                    double score = TextSimilarity.similarity(mine.grams(), theirs.grams());
                    if (score > bestScore) {
                        bestScore = score;
                        best = theirs;
                    }
                }
                if (best != null && bestScore >= SIMILAR_THRESHOLD) {
                    similar.add(new DuplicateMatch(where + "SIMILAR", text.content(), best.raw(), c.id(), c.title(), c.externalId(), round(bestScore)));
                }
            }
        }
        // An exact / same-id hit already settles the verdict; listing every similar text on top would only add noise.
        if (!matches.isEmpty()) return matches;
        similar.sort(Comparator.comparingDouble(DuplicateMatch::similarity).reversed());
        return new ArrayList<>(similar.subList(0, Math.min(MAX_MATCHES, similar.size())));
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
