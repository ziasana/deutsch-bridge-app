package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.RedemittelContext;
import com.deutschbridge.backend.RedemittelTestFunctions;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RedemittelContentEnricherTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonNode resource() throws Exception {
        try (InputStream in = getClass().getResourceAsStream("/writing/redemittel-enrichment.json")) {
            return MAPPER.readTree(in);
        }
    }

    private WritingPhrase phrase(String category, String text) {
        WritingPhrase p = new WritingPhrase();
        p.setCategory(RedemittelTestFunctions.of(category));
        p.setPhrase(text);
        return p;
    }

    @Test
    @DisplayName("apply -> fills meaning, grammar pattern and default contexts of an empty phrase")
    void fillsEmpty() throws Exception {
        JsonNode root = resource();
        WritingPhrase p = phrase("OPINION", "Ich bin der Meinung, dass …");
        assertTrue(RedemittelContentEnricher.apply(p, root.path("meanings"), root.path("grammar")));
        assertEquals("I am of the opinion that …", p.getMeaningEn());
        assertEquals("Ich bin der Meinung, dass + Nebensatz", p.getGrammarPattern());
        assertTrue(RedemittelText.splitContexts(p.getContexts()).contains(RedemittelContext.EXAM));
    }

    @Test
    @DisplayName("apply -> never overwrites what an admin already wrote, and a second run changes nothing")
    void keepsAdminEdits() throws Exception {
        JsonNode root = resource();
        WritingPhrase p = phrase("OPINION", "Ich bin der Meinung, dass …");
        p.setMeaningEn("My own gloss");
        p.setContexts("WORK");
        RedemittelContentEnricher.apply(p, root.path("meanings"), root.path("grammar"));
        assertEquals("My own gloss", p.getMeaningEn());
        assertEquals("WORK", p.getContexts());
        assertFalse(RedemittelContentEnricher.apply(p, root.path("meanings"), root.path("grammar")));
    }

    @Test
    @DisplayName("every category has default contexts, and unknown phrases still get them")
    void defaultsForEverything() throws Exception {
        JsonNode root = resource();
        for (String c : RedemittelTestFunctions.LABELS.keySet()) {
            assertNotNull(RedemittelContentEnricher.DEFAULT_CONTEXTS.get(c), c);
        }
        WritingPhrase p = phrase("APOLOGY", "Eine ganz neue Phrase");
        RedemittelContentEnricher.apply(p, root.path("meanings"), root.path("grammar"));
        assertNull(p.getMeaningEn());
        assertFalse(Arrays.asList(p.getContexts().split(",")).isEmpty());
    }

    // ---- B1 details ----

    @Test
    @DisplayName("details -> every built-in B1 phrase has all five learner fields")
    void everyB1PhraseHasAllDetails() throws Exception {
        java.util.Map<String, JsonNode> details = RedemittelContentEnricher.loadDetails(MAPPER);
        try (InputStream in = getClass().getResourceAsStream("/writing/guide-B1.json")) {
            for (JsonNode n : MAPPER.readTree(in).path("phrases")) {
                JsonNode d = details.get("B1|" + n.path("phrase").asText());
                assertNotNull(d, n.path("phrase").asText());
                for (String field : new String[]{"explanation", "usageNote", "grammarPattern", "commonMistake"}) {
                    assertTrue(d.hasNonNull(field) && !d.get(field).asText().isBlank(), field + " of " + n.path("phrase").asText());
                }
                assertTrue(d.path("similarExpressions").size() >= 2, "similar of " + n.path("phrase").asText());
                assertTrue(d.get("commonMistake").asText().contains("❌") && d.get("commonMistake").asText().contains("✓"), "mistake format");
            }
        }
    }

    @Test
    @DisplayName("applyDetails -> fills empty fields only and stores similar expressions one per line")
    void detailsFillOnlyEmpty() throws Exception {
        JsonNode d = RedemittelContentEnricher.loadDetails(MAPPER).get("B1|Ich bin der Meinung, dass …");
        WritingPhrase p = phrase("OPINION", "Ich bin der Meinung, dass …");
        p.setUsageNote("Mein eigener Hinweis");

        assertTrue(RedemittelContentEnricher.applyDetails(p, d));

        assertEquals("Mein eigener Hinweis", p.getUsageNote());
        assertNotNull(p.getExplanation());
        assertEquals("Ich bin der Meinung, dass + Nebensatz (Verb am Ende)", p.getGrammarPattern());
        assertEquals(List.of("Meiner Meinung nach …", "Ich vertrete die Ansicht, dass …", "Meines Erachtens …"),
                RedemittelText.splitLines(p.getSimilarExpressions()));
        assertFalse(RedemittelContentEnricher.applyDetails(p, d), "second run changes nothing");
    }

    @Test
    @DisplayName("applyDetails -> a phrase without a details entry is untouched")
    void noEntry() {
        assertFalse(RedemittelContentEnricher.applyDetails(phrase("OPINION", "Unbekannt"), null));
    }

    // ---- B1 examples ----

    /** The B1 phrases exactly as the seeder creates them from the guide file, then enriched with the details file. */
    private List<WritingPhrase> enrichedB1() throws Exception {
        java.util.Map<String, JsonNode> details = RedemittelContentEnricher.loadDetails(MAPPER);
        List<WritingPhrase> list = new java.util.ArrayList<>();
        try (InputStream in = getClass().getResourceAsStream("/writing/guide-B1.json")) {
            for (JsonNode n : MAPPER.readTree(in).path("phrases")) {
                WritingPhrase p = phrase(n.get("category").asText(), n.get("phrase").asText());
                p.setLevel(com.deutschbridge.backend.model.enums.LearningLevel.B1);
                if (n.hasNonNull("example")) p.setExample(n.get("example").asText());
                RedemittelContentEnricher.applyDetails(p, details.get("B1|" + p.getPhrase()));
                list.add(p);
            }
        }
        return list;
    }

    @Test
    @DisplayName("examples -> every B1 phrase has one that works as a word-order puzzle")
    void everyB1PhraseHasAWordOrderExample() throws Exception {
        for (WritingPhrase p : enrichedB1()) {
            assertNotNull(p.getExample(), p.getPhrase());
            assertTrue(RedemittelExerciseFactory.wordOrderTokens(p).isPresent(), p.getPhrase() + " -> " + p.getExample());
        }
    }

    @Test
    @DisplayName("examples -> the cloze works for every B1 phrase except the fragments that cannot be matched in a sentence")
    void clozeEligibility() throws Exception {
        java.util.Set<String> notCloze = new java.util.TreeSet<>();
        for (WritingPhrase p : enrichedB1()) {
            if (RedemittelExerciseFactory.clozeBlank(p).isEmpty()) notCloze.add(p.getPhrase());
        }
        assertEquals(java.util.Set.of("…, weil …", "…, denn …", "Könnten Sie mir bitte … schicken?"), notCloze);
    }

    @Test
    @DisplayName("examples -> the cloze blanks the phrase and leaves the rest of the sentence")
    void clozeLooksRight() throws Exception {
        WritingPhrase p = enrichedB1().stream().filter(x -> x.getPhrase().equals("Wie wäre es mit …?")).findFirst().orElseThrow();
        assertEquals("________ Sonntag?", RedemittelExerciseFactory.clozeBlank(p).orElseThrow());
        WritingPhrase q = enrichedB1().stream().filter(x -> x.getPhrase().equals("Ich bin der Meinung, dass …")).findFirst().orElseThrow();
        assertEquals("________ öffentliche Verkehrsmittel billiger sein sollten.", RedemittelExerciseFactory.clozeBlank(q).orElseThrow());
    }

    @Test
    @DisplayName("examples -> an existing example is kept, the one-word stub is replaced")
    void exampleFillRules() throws Exception {
        java.util.Map<String, JsonNode> details = RedemittelContentEnricher.loadDetails(MAPPER);

        WritingPhrase own = phrase("OPINION", "Ich denke, dass …");
        own.setLevel(com.deutschbridge.backend.model.enums.LearningLevel.B1);
        own.setExample("Mein eigenes Beispiel.");
        RedemittelContentEnricher.applyDetails(own, details.get("B1|Ich denke, dass …"));
        assertEquals("Mein eigenes Beispiel.", own.getExample());

        WritingPhrase stub = phrase("GREETING", "Liebe Anna, / Lieber Peter,");
        stub.setLevel(com.deutschbridge.backend.model.enums.LearningLevel.B1);
        stub.setExample("Liebe Anna, …");
        RedemittelContentEnricher.applyDetails(stub, details.get("B1|Liebe Anna, / Lieber Peter,"));
        assertEquals("Liebe Anna, vielen Dank für deine Einladung zur Party.", stub.getExample());
    }
}
