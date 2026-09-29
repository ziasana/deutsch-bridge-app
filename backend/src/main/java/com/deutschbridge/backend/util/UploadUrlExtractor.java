package com.deutschbridge.backend.util;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Finds every "/uploads/..." reference embedded in admin-authored text (e.g. an {@code <img
 * src="/uploads/exam-passages/xyz.webp">} inside a RichTextEditor-authored HTML field), so a
 * caller can diff an entity's old vs new content and delete files the new version no longer
 * references - see ExamExerciseService.
 */
public final class UploadUrlExtractor {

    private static final Pattern UPLOAD_URL_PATTERN = Pattern.compile("/uploads/[\\w./-]+");

    private UploadUrlExtractor() {
        throw new IllegalStateException("Utility class");
    }

    /** Accepts any number of fields (content, transcript, a standalone imageUrl/audioUrl, ...); nulls are ignored. */
    public static Set<String> extract(String... texts) {
        Set<String> urls = new LinkedHashSet<>();
        for (String text : texts) {
            if (text == null) continue;
            Matcher matcher = UPLOAD_URL_PATTERN.matcher(text);
            while (matcher.find()) {
                urls.add(matcher.group());
            }
        }
        return urls;
    }
}
