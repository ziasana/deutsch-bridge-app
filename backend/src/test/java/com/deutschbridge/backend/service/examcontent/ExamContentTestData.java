package com.deutschbridge.backend.service.examcontent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.List;

/** Builds import files for tests. */
final class ExamContentTestData {

    static final ObjectMapper MAPPER = new ObjectMapper();
    static final List<String> IDS = List.of("a", "b", "c", "d", "e", "f", "g", "h", "i", "j");
    static final List<String> ANSWERS = List.of("e", "c", "j", "a", "h");

    private ExamContentTestData() {
    }

    static String text(int seed) {
        // ~45 pseudo-random "words" (seeded, so reproducible): long enough to pass the length check,
        // and texts from different seeds share almost no trigrams, so they never look similar.
        java.util.Random random = new java.util.Random(seed * 7919L + 13);
        String letters = "abcdefghiklmnoprstuwz";
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < 45; i++) {
            int len = 4 + random.nextInt(6);
            for (int j = 0; j < len; j++) b.append(letters.charAt(random.nextInt(letters.length())));
            b.append(' ');
        }
        return b.toString().trim() + ".";
    }

    static String headingText(int seed, int i) {
        java.util.Random random = new java.util.Random(seed * 104729L + i * 31L);
        String letters = "abcdefghiklmnoprstuwz";
        StringBuilder b = new StringBuilder();
        for (int w = 0; w < 4; w++) {
            for (int j = 0, len = 4 + random.nextInt(5); j < len; j++) b.append(letters.charAt(random.nextInt(letters.length())));
            b.append(' ');
        }
        return b.toString().trim();
    }

    static ObjectNode exercise(String externalId, int seed) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("externalId", externalId);
        ex.put("title", "B1 Lesen Teil 1 " + externalId);
        ex.put("instructions", "Lesen Sie die fünf Texte.");
        ArrayNode headings = ex.putArray("headings");
        for (int i = 0; i < IDS.size(); i++) {
            headings.addObject().put("id", IDS.get(i)).put("text", headingText(seed, i));
        }
        ArrayNode texts = ex.putArray("texts");
        for (int i = 0; i < 5; i++) {
            texts.addObject().put("id", "text_" + (i + 1)).put("content", text(seed * 10 + i)).put("correctHeadingId", ANSWERS.get(i));
        }
        ex.putObject("metadata").put("difficulty", "MEDIUM").putArray("topics").add("WORK");
        return ex;
    }

    static ObjectNode batch(ObjectNode... exercises) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "TELC");
        root.put("level", "B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_1");
        ArrayNode array = root.putArray("exercises");
        for (ObjectNode e : exercises) array.add(e);
        return root;
    }
}
