package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.entity.ExamPassage;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

/** Order-independent SHA-256 over the normalised passage texts of an exercise. */
public final class ExamContentFingerprint {

    private ExamContentFingerprint() {
    }

    public static String hash(List<ExamPassage> passages) {
        if (passages == null) return null;
        return hashTexts(passages.stream().map(ExamPassage::getContent).toList());
    }

    public static String hashTexts(List<String> texts) {
        String joined = texts.stream()
                .map(TextSimilarity::normalize)
                .filter(t -> !t.isEmpty())
                .sorted()
                .reduce("", (a, b) -> a + "\n" + b);
        if (joined.isEmpty()) return null;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(joined.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
