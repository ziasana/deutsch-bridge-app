package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptResponse;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** DTZ Mündliche Prüfung: Teil 1 fixed template, Teil 2 photo + experience questions, Teil 3 joint planning - structure, warnings and prompts. */
class ExamContentDtzOralTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final ExamContentValidator validator = new ExamContentValidator();

    // ---- builders

    static ObjectNode teil1() {
        return DtzOralTemplates.teil1().put("exam", "DTZ").put("section", "MUENDLICH").put("level", "A2_B1");
    }

    private static ObjectNode teil2() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ").put("section", "MUENDLICH").put("part", 2).put("level", "A2_B1");
        ex.put("exerciseType", "PHOTO_EXPERIENCE");
        ex.put("title", "Einkaufen im Internet");
        ex.put("topic", "Einkaufen");
        ObjectNode image = ex.putObject("image");
        image.putNull("imageUrl");
        image.put("imagePrompt", "An original realistic photograph showing an adult shopping online at home, with a laptop and a parcel visible, natural lighting, no readable text, no logos, no watermarks, suitable for a German A2-B1 speaking exercise.");
        image.put("altText", "Eine Frau sitzt zu Hause am Laptop und bestellt etwas im Internet.");
        ObjectNode a = ex.putObject("participantA");
        a.put("title", "Bildbeschreibung").put("instructions", DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS);
        a.putArray("questions").add(DtzOralSchema.PICTURE_PROMPTS.get(0)).add(DtzOralSchema.PICTURE_PROMPTS.get(1));
        ObjectNode b = ex.putObject("participantB");
        b.put("title", "Eigene Erfahrungen").put("instructions", DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS);
        b.putArray("questionsA2").add("Was haben Sie schon im Internet gekauft?").add("Welche Produkte kaufen Sie lieber im Internet und welche im Geschäft? Warum?")
                .add("Wie kaufen die Menschen in Ihrem Heimatland ein?").add("Wo kaufen Sie sonst noch ein?");
        b.putArray("questionsB1").add("Wo kaufen Sie meistens ein? Warum?").add("Welche Erfahrungen haben Sie mit Einkäufen im Internet gemacht?")
                .add("Welche Vor- und Nachteile gibt es?").add("Wie unterscheidet sich das Einkaufsverhalten in Ihrem Heimatland?");
        ex.putObject("possibleSolution")
                .put("description", "Auf dem Foto sehe ich eine Frau. Sie sitzt zu Hause am Tisch und kauft im Internet ein. Neben ihr liegt ein Paket.")
                .put("experienceA2", "Ich habe schon Schuhe im Internet gekauft. Im Geschäft kaufe ich lieber Lebensmittel.")
                .put("experienceB1", "Ich kaufe oft im Internet ein, weil das bequem ist. Der Nachteil ist, dass man die Ware nicht anprobieren kann.");
        return ex;
    }

    private static ObjectNode teil3() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ").put("section", "MUENDLICH").put("part", 3).put("level", "A2_B1");
        ex.put("exerciseType", "JOINT_PLANNING");
        ex.put("title", "Ein Klassenfest organisieren");
        ex.put("topic", "Klassenfest");
        ex.put("situation", "Ihr Deutschkurs möchte am Ende des Semesters ein kleines Fest feiern. Sie beide organisieren das Klassenfest.");
        ex.put("taskInstruction", DtzOralSchema.TASK_INSTRUCTION);
        ArrayNode notes = ex.putArray("planningNotes");
        String[] labels = {"Wann?", "Wo feiern?", "Essen und Trinken?", "Musik?", "Wer bringt was mit?"};
        for (int i = 0; i < labels.length; i++) notes.addObject().put("number", i + 1).put("label", labels[i]);
        ArrayNode dialogue = ex.putObject("possibleSolution").putArray("dialogue");
        String[] turns = {"Wann wollen wir das Fest machen?", "Ich schlage den letzten Freitag vor. Was meinst du?", "Gute Idee. Und wo feiern wir?",
                "Im Kursraum, dann brauchen wir nichts zu mieten.", "Einverstanden. Wer bringt Essen und Trinken mit?", "Jeder bringt etwas mit, und ich kümmere mich um die Musik."};
        for (int i = 0; i < turns.length; i++) dialogue.addObject().put("speaker", i % 2 == 0 ? "A" : "B").put("text", turns[i]);
        return ex;
    }

    private List<String> errors(ObjectNode ex) {
        return validator.validate(ex).exerciseIssues().get(0).stream().filter(i -> "ERROR".equals(i.severity())).map(i -> i.code()).toList();
    }

    private List<String> warnings(ObjectNode ex) {
        return validator.validate(ex).exerciseIssues().get(0).stream().filter(i -> "WARNING".equals(i.severity())).map(i -> i.code()).toList();
    }

    private static ObjectNode withPart(ObjectNode ex) {
        ex.put("exerciseType", ex.get("exerciseType").asText());
        return ex;
    }

    // ---- registry

    @Test
    void theThreePartsAreRegisteredWithTheirOwnTaskTypes() {
        for (int part = 1; part <= 3; part++) {
            ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, part).orElseThrow();
            assertTrue(spec.isDtzOral());
            assertFalse(spec.isSpeaking(), "the Telc speaking reader must not handle DTZ");
            assertEquals(DtzOralSchema.taskTypeOf(part), spec.taskType().name());
        }
    }

    // ---- Teil 1

    @Test
    void teil1TemplateIsValidAndKeepsTheSixFixedTopicsInOrder() {
        ObjectNode ex = teil1().put("part", 1);
        assertEquals(List.of(), errors(ex));
        var parsed = validator.validate(ex).exercises().get(0);
        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> topics = (List<java.util.Map<String, Object>>) parsed.dtzOral().data().get("topics");
        assertEquals(List.of("Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen"), topics.stream().map(t -> t.get("label")).toList());
    }

    @Test
    void teil1RejectsAnExtraTopic() {
        ObjectNode ex = teil1().put("part", 1);
        ((ArrayNode) ex.get("topics")).addObject().put("number", 7).put("label", "Hobbys");
        assertTrue(errors(ex).contains("TEIL1_TOPIC_COUNT"));
    }

    @Test
    void teil1RejectsAMissingTopic() {
        ObjectNode ex = teil1().put("part", 1);
        ((ArrayNode) ex.get("topics")).remove(5);
        assertTrue(errors(ex).contains("TEIL1_TOPIC_COUNT"));
    }

    @Test
    void teil1RejectsAChangedLabelAndAChangedOrder() {
        ObjectNode renamed = teil1().put("part", 1);
        ((ObjectNode) renamed.get("topics").get(2)).put("label", "Wohnung");
        assertTrue(errors(renamed).contains("TEIL1_TOPIC_LABEL"));

        ObjectNode swapped = teil1().put("part", 1);
        ((ObjectNode) swapped.get("topics").get(0)).put("label", "Geburtsort");
        ((ObjectNode) swapped.get("topics").get(1)).put("label", "Name");
        assertTrue(errors(swapped).contains("TEIL1_TOPIC_LABEL"));
    }

    @Test
    void teil1KeepsSampleAnswersOutOfTheFixedTopics() {
        ObjectNode ex = teil1().put("part", 1);
        ((ObjectNode) ex.get("topics").get(0)).put("exampleAnswer", "Ich heiße Max Mustermann.");
        assertTrue(errors(ex).contains("TEIL1_TOPIC_CONTENT"));
    }

    @Test
    void teil1PracticeSupportIsOptionalAndSeparate() {
        ObjectNode ex = teil1().put("part", 1);
        ex.remove("practiceSupport");
        assertEquals(List.of(), errors(ex));
        ex.putArray("practiceSupport").addObject().put("topicNumber", 9);
        assertTrue(errors(ex).contains("PRACTICE_TOPIC_INVALID"));
    }

    @Test
    void teil1AcceptsOptionalMultilingualExplanations() {
        ObjectNode ex = teil1().put("part", 1);
        ex.putObject("explanation").put("en", "Say a few words about each topic.").put("fa", "درباره هر موضوع چند جمله بگویید.");
        assertEquals(List.of(), errors(ex));
    }

    // ---- Teil 2

    @Test
    void teil2IsValidWithoutAnImageButWarnsThatNoImageIsAttached() {
        ObjectNode ex = teil2();
        assertEquals(List.of(), errors(ex));
        assertTrue(warnings(ex).contains("IMAGE_PENDING"));
    }

    @Test
    void teil2RequiresTheTwoPictureDescriptionPrompts() {
        ObjectNode one = teil2();
        ((ArrayNode) one.get("participantA").get("questions")).remove(1);
        assertTrue(errors(one).contains("PICTURE_PROMPTS_INVALID"));

        ObjectNode changed = teil2();
        ((ArrayNode) changed.get("participantA").get("questions")).set(1, MAPPER.getNodeFactory().textNode("Beschreiben Sie das Foto."));
        assertTrue(errors(changed).contains("PICTURE_PROMPTS_INVALID"));

        ObjectNode wrongInstruction = teil2();
        ((ObjectNode) wrongInstruction.get("participantA")).put("instructions", "Beschreiben Sie das Bild.");
        assertTrue(errors(wrongInstruction).contains("PARTICIPANT_A_INSTRUCTION"));
    }

    @Test
    void teil2RequiresBothParticipantsAndExactlyFourQuestionsPerLevel() {
        ObjectNode noB = teil2();
        noB.remove("participantB");
        assertTrue(errors(noB).contains("PARTICIPANT_B_MISSING"));

        ObjectNode noA2 = teil2();
        ((ObjectNode) noA2.get("participantB")).remove("questionsA2");
        assertTrue(errors(noA2).contains("QUESTIONS_A2_INVALID"));

        ObjectNode threeB1 = teil2();
        ((ArrayNode) threeB1.get("participantB").get("questionsB1")).remove(3);
        assertTrue(errors(threeB1).contains("QUESTIONS_B1_INVALID"));

        ObjectNode wrongInstruction = teil2();
        ((ObjectNode) wrongInstruction.get("participantB")).put("instructions", "Erzählen Sie etwas.");
        assertTrue(errors(wrongInstruction).contains("PARTICIPANT_B_INSTRUCTION"));
    }

    @Test
    void teil2RejectsEmptyDuplicatedAndPlaceholderQuestions() {
        ObjectNode empty = teil2();
        ((ArrayNode) empty.get("participantB").get("questionsA2")).set(0, MAPPER.getNodeFactory().textNode("  "));
        assertTrue(errors(empty).contains("QUESTION_EMPTY"));

        ObjectNode duplicate = teil2();
        ((ArrayNode) duplicate.get("participantB").get("questionsA2")).set(1, MAPPER.getNodeFactory().textNode("Was haben Sie schon im Internet gekauft?"));
        assertTrue(errors(duplicate).contains("QUESTION_DUPLICATE"));

        ObjectNode placeholder = teil2();
        ((ArrayNode) placeholder.get("participantB").get("questionsB1")).set(0, MAPPER.getNodeFactory().textNode("..."));
        assertTrue(errors(placeholder).contains("PLACEHOLDER_CONTENT"));
    }

    @Test
    void teil2NeedsATopic() {
        ObjectNode noTopic = teil2();
        noTopic.remove("topic");
        assertTrue(errors(noTopic).contains("TOPIC_MISSING"));
    }

    @Test
    void teil2CanBeImportedWithoutAnyImageData() {
        ObjectNode noImage = teil2();
        noImage.remove("image");
        assertEquals(List.of(), errors(noImage));
        assertTrue(warnings(noImage).contains("IMAGE_DATA_MISSING"));
        assertTrue(warnings(noImage).contains("IMAGE_PENDING"));

        ObjectNode emptyImage = teil2();
        ((ObjectNode) emptyImage.get("image")).remove("imagePrompt");
        assertEquals(List.of(), errors(emptyImage));

        ObjectNode nullImage = teil2();
        nullImage.putNull("image");
        assertEquals(List.of(), errors(nullImage));

        ObjectNode emptyUrl = teil2();
        ((ObjectNode) emptyUrl.get("image")).put("imageUrl", "");
        assertEquals(List.of(), errors(emptyUrl));
    }

    @Test
    void teil2DropsPlaceholderAndExternalImageUrlsWithAWarning() {
        for (String url : List.of("https://example.com/placeholder.jpg", "https://via.placeholder.com/600x400", "/uploads/exam-passages/placeholder.png", "photo.jpg")) {
            ObjectNode ex = teil2();
            ((ObjectNode) ex.get("image")).put("imageUrl", url);
            assertEquals(List.of(), errors(ex), url);
            assertTrue(warnings(ex).contains("IMAGE_URL_IGNORED"), url);
            var image = (java.util.Map<?, ?>) validator.validate(ex).exercises().get(0).dtzOral().data().get("image");
            assertNull(image.get("imageUrl"), "the link must not be stored: " + url);
        }
        ObjectNode uploaded = teil2();
        ((ObjectNode) uploaded.get("image")).put("imageUrl", "/uploads/exam-passages/abc123.webp");
        assertEquals(List.of(), errors(uploaded));
        assertFalse(warnings(uploaded).contains("IMAGE_PENDING"));
    }

    @Test
    void teil2SemanticChecksAreWarningsOnly() {
        ObjectNode ex = teil2();
        ((ArrayNode) ex.get("participantB").get("questionsA2")).set(0, MAPPER.getNodeFactory().textNode("Welchen Einfluss hat das Internet auf die Gesellschaft?"));
        ((ArrayNode) ex.get("participantB").get("questionsB1")).set(0, MAPPER.getNodeFactory().textNode("Wo kaufen Sie sonst noch ein?"));
        ((ObjectNode) ex.get("image")).put("imagePrompt", "A woman at a laptop");
        assertEquals(List.of(), errors(ex));
        List<String> warnings = warnings(ex);
        assertTrue(warnings.contains("A2_TOO_ABSTRACT"), warnings.toString());
        assertTrue(warnings.contains("B1_DUPLICATES_A2"), warnings.toString());
        assertTrue(warnings.contains("PHOTO_PROMPT_THIN"), warnings.toString());
        assertTrue(warnings.contains("PHOTO_PROMPT_TEXT_RISK"), warnings.toString());
    }

    @Test
    void teil2WarnsWhenQuestionsDoNotFitTheTopic() {
        ObjectNode ex = teil2();
        ex.put("topic", "Reisen");
        ((ObjectNode) ex.get("image")).put("imagePrompt", "A family at the airport with suitcases, natural light, no readable text, no logos, no watermarks, everyday scene for adults.")
                .put("altText", "Eine Familie wartet am Flughafen.");
        assertTrue(warnings(ex).contains("QUESTIONS_OFF_TOPIC"));
    }

    @Test
    void anExerciseTypeOfAnotherPartIsRejected() {
        ObjectNode ex = teil2();
        ex.put("exerciseType", "JOINT_PLANNING");
        assertTrue(errors(ex).contains("EXERCISE_TYPE_INVALID"));
    }

    // ---- Teil 3

    @Test
    void teil3IsValid() {
        assertEquals(List.of(), errors(teil3()));
        assertEquals(List.of(), warnings(teil3()));
    }

    @Test
    void teil3RequiresASituationTheExactInstructionAndFourToSixNotes() {
        ObjectNode noSituation = teil3();
        noSituation.remove("situation");
        assertTrue(errors(noSituation).contains("SITUATION_MISSING"));

        ObjectNode instruction = teil3();
        instruction.put("taskInstruction", "Planen Sie etwas.");
        assertTrue(errors(instruction).contains("TASK_INSTRUCTION_INVALID"));

        ObjectNode few = teil3();
        ((ArrayNode) few.get("planningNotes")).remove(4);
        ((ArrayNode) few.get("planningNotes")).remove(3);
        assertTrue(errors(few).contains("NOTES_COUNT"));

        ObjectNode many = teil3();
        for (int i = 0; i < 2; i++) ((ArrayNode) many.get("planningNotes")).addObject().put("number", 6 + i).put("label", "Extra " + i + "?");
        assertTrue(errors(many).contains("NOTES_COUNT"));

        ObjectNode none = teil3();
        none.remove("planningNotes");
        assertTrue(errors(none).contains("NOTES_MISSING"));
    }

    @Test
    void teil3RejectsEmptyAndDuplicatedNotesAndADialogue() {
        ObjectNode empty = teil3();
        ((ObjectNode) empty.get("planningNotes").get(1)).put("label", " ");
        assertTrue(errors(empty).contains("NOTE_EMPTY"));

        ObjectNode duplicate = teil3();
        ((ObjectNode) duplicate.get("planningNotes").get(1)).put("label", "wann");
        assertTrue(errors(duplicate).contains("NOTE_DUPLICATE"));

        ObjectNode dialogue = teil3();
        dialogue.putArray("exampleDialogue").addObject().put("speaker", "A").put("text", "Hallo!");
        assertTrue(errors(dialogue).contains("DIALOGUE_NOT_ALLOWED"));
    }

    @Test
    void teil3SemanticChecksAreWarningsOnly() {
        ObjectNode copied = teil3();
        ArrayNode notes = (ArrayNode) copied.get("planningNotes");
        notes.removeAll();
        List<String> hiking = DtzOralSchema.HIKING_EXAMPLE_NOTES;
        for (int i = 0; i < hiking.size(); i++) notes.addObject().put("number", i + 1).put("label", hiking.get(i));
        assertEquals(List.of(), errors(copied));
        assertTrue(warnings(copied).contains("HIKING_EXAMPLE_COPIED"));

        ObjectNode notJoint = teil3();
        notJoint.put("situation", "Am Samstag ist schönes Wetter und die Sonne scheint den ganzen Tag über der Stadt.");
        assertTrue(warnings(notJoint).contains("SITUATION_NOT_JOINT"));

        ObjectNode unrelated = teil3();
        ((ObjectNode) unrelated.get("planningNotes").get(3)).put("label", "Raumfahrttechnik?");
        assertTrue(warnings(unrelated).contains("NOTE_UNRELATED"));
    }

    // ---- prompts: one per part

    private PromptResponse prompt(int part, List<String> topics, Integer count) {
        ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, part).orElseThrow();
        PromptRequest request = new PromptRequest("DTZ", "A2_B1", "MUENDLICH", "TEIL_" + part, count, "A2_B1", topics, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        return new ExamContentPromptBuilder().build(spec, request, 0, 1, List.of());
    }

    @Test
    void everyPartHasItsOwnPrompt() {
        String p1 = prompt(1, List.of(), null).prompt();
        String p2 = prompt(2, List.of("Einkaufen"), null).prompt();
        String p3 = prompt(3, List.of("Einen Ausflug planen"), null).prompt();
        assertTrue(p1.contains("Geburtsort") && p1.contains("Arbeit/Beruf") && p1.contains("Do not invent a new set of topics"));
        assertTrue(p2.contains(DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS) && p2.contains("Topic: Einkaufen") && p2.contains("imagePrompt"));
        assertTrue(p2.contains("A2 question count: 4") && p2.contains("B1 question count: 4"));
        assertTrue(p3.contains(DtzOralSchema.TASK_INSTRUCTION) && p3.contains("Topic: Einen Ausflug planen") && p3.contains("Planning notes: 4–6"));
        assertFalse(p2.contains("{{") || p3.contains("{{") || p1.contains("{{"), "all template markers must be filled");
        assertNotEquals(p2, p3);
    }

    @Test
    void thePromptExampleIsAValidFileForItsPart() throws Exception {
        for (int part = 1; part <= 3; part++) {
            ObjectNode example = (ObjectNode) MAPPER.readTree(prompt(part, List.of(), null).jsonExample());
            // The schema example carries "..." placeholders on purpose; apart from them it must be accepted by the structural checks.
            List<String> errors = errors(example);
            assertTrue(errors.stream().allMatch(c -> c.equals("PLACEHOLDER_CONTENT")), "part " + part + ": " + errors);
        }
    }

    @Test
    void batchPromptWrapsTheExercises() {
        String prompt = prompt(2, List.of("Reisen", "Sport"), 3).prompt();
        assertTrue(prompt.contains("EXAM_EXERCISE_BATCH") && prompt.contains("exactly 3"));
    }

    @Test
    void aSingleExerciseFileNeedsNoEnvelope() {
        // A bare exercise with exam / section / part is accepted the way the prompts ask for it.
        assertEquals(List.of(), errors(teil3()));
    }

    @Test
    void genericDifficultyValuesOfTheGeneratorPageAreAccepted() {
        ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, 1).orElseThrow();
        for (String difficulty : List.of("MIXED", "EASY", "MEDIUM", "HARD", "A2", "B1")) {
            PromptRequest request = new PromptRequest("DTZ", "A2_B1", "MUENDLICH", "TEIL_1", 10, difficulty, List.of(), null,
                    null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
            assertDoesNotThrow(() -> new ExamContentPromptBuilder().build(spec, request, 0, 1), difficulty);
        }
    }

    @Test
    void teil2PossibleSolutionIsOptionalButKept() {
        ObjectNode ex = teil2();
        assertEquals(List.of(), errors(ex));
        assertFalse(warnings(ex).contains("SOLUTION_MISSING"));
        var data = validator.validate(ex).exercises().get(0).dtzOral().data();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> solution = (java.util.Map<String, Object>) data.get("possibleSolution");
        assertTrue(((String) solution.get("description")).startsWith("Auf dem Foto sehe ich"));
        assertNotNull(solution.get("experienceA2"));
        assertNotNull(solution.get("experienceB1"));

        ObjectNode without = teil2();
        without.remove("possibleSolution");
        assertEquals(List.of(), errors(without));
        assertTrue(warnings(without).contains("SOLUTION_MISSING"));
    }

    @Test
    void teil2PossibleSolutionMustBePlainTextOfTheRightShape() {
        ObjectNode notObject = teil2();
        notObject.put("possibleSolution", "Ein Text");
        assertTrue(errors(notObject).contains("SOLUTION_INVALID"));

        ObjectNode html = teil2();
        ((ObjectNode) html.get("possibleSolution")).put("description", "<script>alert(1)</script>");
        assertTrue(errors(html).contains("HTML_CONTENT"));

        ObjectNode placeholder = teil2();
        ((ObjectNode) placeholder.get("possibleSolution")).put("experienceB1", "...");
        assertTrue(errors(placeholder).contains("PLACEHOLDER_CONTENT"));
    }

    @Test
    void teil2PromptAsksForThePossibleSolution() {
        String prompt = prompt(2, List.of(), null).prompt();
        assertTrue(prompt.contains("possibleSolution") && prompt.contains("experienceA2"));
    }

    @Test
    void aLongImagePromptIsAcceptedUpToTheLimit() {
        ObjectNode ex = teil2();
        ((ObjectNode) ex.get("image")).put("imagePrompt", "An original realistic photograph, natural light, no readable text, no logos, no watermarks. ".repeat(20));
        assertEquals(List.of(), errors(ex));
        ((ObjectNode) ex.get("image")).put("imagePrompt", "x".repeat(ExamDtzOralReader.MAX_PROMPT + 1));
        assertTrue(errors(ex).contains("IMAGE_PROMPT_TOO_LONG"));
    }

    @Test
    void teil3PossibleSolutionIsKeptAndOptional() {
        ObjectNode ex = teil3();
        assertEquals(List.of(), errors(ex));
        var data = validator.validate(ex).exercises().get(0).dtzOral().data();
        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> dialogue = (List<java.util.Map<String, Object>>) ((java.util.Map<String, Object>) data.get("possibleSolution")).get("dialogue");
        assertEquals(6, dialogue.size());
        assertEquals("A", dialogue.get(0).get("speaker"));

        ObjectNode without = teil3();
        without.remove("possibleSolution");
        assertEquals(List.of(), errors(without));
        assertTrue(warnings(without).contains("SOLUTION_MISSING"));
    }

    @Test
    void teil3PossibleSolutionMustBeAValidDialogue() {
        ObjectNode notObject = teil3();
        notObject.put("possibleSolution", "Text");
        assertTrue(errors(notObject).contains("SOLUTION_INVALID"));

        ObjectNode tooShort = teil3();
        ((ArrayNode) tooShort.get("possibleSolution").get("dialogue")).remove(5);
        ((ArrayNode) tooShort.get("possibleSolution").get("dialogue")).remove(4);
        ((ArrayNode) tooShort.get("possibleSolution").get("dialogue")).remove(3);
        assertTrue(errors(tooShort).contains("SOLUTION_INVALID"));

        ObjectNode badSpeaker = teil3();
        ((ObjectNode) badSpeaker.get("possibleSolution").get("dialogue").get(1)).put("speaker", "C");
        assertTrue(errors(badSpeaker).contains("SOLUTION_INVALID"));

        ObjectNode placeholder = teil3();
        ((ObjectNode) placeholder.get("possibleSolution").get("dialogue").get(1)).put("text", "...");
        assertTrue(errors(placeholder).contains("PLACEHOLDER_CONTENT"));
    }

    @Test
    void teil3PossibleSolutionWarnsWhenItIgnoresTheNotesOrHasOneSpeaker() {
        ObjectNode ex = teil3();
        ArrayNode dialogue = (ArrayNode) ex.get("possibleSolution").get("dialogue");
        for (int i = 0; i < dialogue.size(); i++) ((ObjectNode) dialogue.get(i)).put("speaker", "A").put("text", "Das Wetter ist heute schön und die Sonne scheint.");
        assertEquals(List.of(), errors(ex));
        List<String> warnings = warnings(ex);
        assertTrue(warnings.contains("SOLUTION_ONE_SPEAKER"), warnings.toString());
        assertTrue(warnings.contains("SOLUTION_IGNORES_NOTES"), warnings.toString());
    }

    @Test
    void theTaskItselfStillMayNotContainADialogue() {
        ObjectNode ex = teil3();
        ex.putArray("dialogue").addObject().put("speaker", "A").put("text", "Hallo!");
        assertTrue(errors(ex).contains("DIALOGUE_NOT_ALLOWED"));
    }

    @Test
    void teil3PromptAsksForThePossibleSolution() {
        assertTrue(prompt(3, List.of(), null).prompt().contains("possibleSolution"));
    }
}
