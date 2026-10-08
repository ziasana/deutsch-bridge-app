package com.deutschbridge.backend.service.examcontent;

import org.springframework.web.util.HtmlUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Turns the structured content of an advertisement (headline, details, contact ...) into the passage HTML
 * the learner player already renders. Paragraphs are {@code <p>} blocks and the details are separated by
 * {@code <br>}, so {@link ExamContentMapper#toPlainText} gives the same text back.
 */
public final class AdvertisementRenderer {

    private AdvertisementRenderer() {
    }

    public static String toHtml(Map<String, Object> content) {
        StringBuilder html = new StringBuilder();
        for (String paragraph : paragraphs(content)) {
            html.append("<p>").append(paragraph).append("</p>");
        }
        return html.toString();
    }

    public static String toPlainText(Map<String, Object> content) {
        return ExamContentMapper.toPlainText(toHtml(content));
    }

    private static List<String> paragraphs(Map<String, Object> content) {
        List<String> out = new ArrayList<>();
        String headline = string(content.get("headline"));
        if (headline != null) out.add("<strong>" + esc(headline) + "</strong>");
        String subheadline = string(content.get("subheadline"));
        if (subheadline != null) out.add("<em>" + esc(subheadline) + "</em>");
        String description = string(content.get("description"));
        if (description != null) out.add(esc(description));
        List<String> details = new ArrayList<>();
        if (content.get("details") instanceof List<?> list) {
            list.forEach(d -> {
                String line = string(d);
                if (line != null) details.add(esc(line));
            });
        }
        if (!details.isEmpty()) out.add(String.join("<br>", details));
        List<String> facts = new ArrayList<>();
        addFact(facts, "Preis", content.get("price"));
        addFact(facts, "Öffnungszeiten", content.get("openingHours"));
        if (!facts.isEmpty()) out.add(String.join("<br>", facts));
        if (content.get("contact") instanceof Map<?, ?> contact) {
            List<String> lines = new ArrayList<>();
            contact.values().forEach(v -> {
                String line = string(v);
                if (line != null) lines.add(esc(line));
            });
            if (!lines.isEmpty()) out.add(String.join("<br>", lines));
        }
        return out;
    }

    private static void addFact(List<String> facts, String label, Object value) {
        String text = string(value);
        if (text != null) facts.add(label + ": " + esc(text));
    }

    private static String esc(String text) {
        return HtmlUtils.htmlEscape(text);
    }

    private static String string(Object value) {
        if (value == null) return null;
        String s = value.toString().strip();
        return s.isEmpty() ? null : s;
    }
}
