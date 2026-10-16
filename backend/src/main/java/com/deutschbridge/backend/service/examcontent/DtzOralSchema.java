package com.deutschbridge.backend.service.examcontent;

import java.util.List;
import java.util.Map;

/**
 * The one definition of the DTZ A2–B1 Mündliche Prüfung content: the fixed texts of the examiner, the six fixed Teil 1 topics and the
 * counts. {@link ExamDtzOralReader} validates against it and the prompt builder prints it into the admin prompt, so the schema an AI is
 * told to produce and the schema the importer accepts cannot drift apart.
 *
 * Teil 1 is a fixed template (the examination content is stable), Teil 2 is a photo with two kinds of questions, Teil 3 is a joint planning
 * task - three different shapes, deliberately not forced into one question-and-answer structure.
 */
public final class DtzOralSchema {

    private DtzOralSchema() {
    }

    public static final String EXAM = "DTZ";
    public static final String SECTION = "MUENDLICH";
    public static final String TYPE_SELF_INTRODUCTION = "SELF_INTRODUCTION";
    public static final String TYPE_PHOTO_EXPERIENCE = "PHOTO_EXPERIENCE";
    public static final String TYPE_JOINT_PLANNING = "JOINT_PLANNING";

    public static final String TEIL1_TITLE = "Über sich sprechen";
    public static final String TEIL1_INSTRUCTIONS = "Stellen Sie sich Ihrer Gesprächspartnerin oder Ihrem Gesprächspartner vor. Sprechen Sie über die folgenden Themen:";

    /** Teil 2 A - the examiner's instruction and the two required picture-description prompts (exact wording). */
    public static final String PARTICIPANT_A_TITLE = "Bildbeschreibung";
    public static final String PARTICIPANT_A_INSTRUCTIONS =
            "Sie haben in einer Zeitschrift ein Foto gefunden. Berichten Sie Ihrer Gesprächspartnerin oder Ihrem Gesprächspartner kurz:";
    public static final List<String> PICTURE_PROMPTS = List.of("Was sehen Sie auf dem Foto?", "Was für eine Situation zeigt dieses Bild?");

    /** Teil 2 B - the experience instruction (exact wording) and the number of follow-up questions per level. */
    public static final String PARTICIPANT_B_TITLE = "Eigene Erfahrungen";
    public static final String PARTICIPANT_B_INSTRUCTIONS = "Erzählen Sie bitte: Welche Erfahrungen haben Sie damit?";
    public static final int QUESTIONS_PER_LEVEL = 4;

    /** Teil 3 - the exact task instruction and the number of planning notes. */
    public static final String TASK_INSTRUCTION = "Planen Sie gemeinsam, was Sie tun wollen.";
    public static final int MIN_NOTES = 4;
    public static final int MAX_NOTES = 6;

    /** The fixed Teil 1 topics, in exam order. The labels are part of the examination and cannot be changed by an editor. */
    public static final List<String> TEIL1_TOPICS = List.of("Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen");

    /** Suggested content categories for Teil 2 (the topic is free text; these are what the generator offers). */
    public static final List<String> PHOTO_TOPICS = List.of(
            "Einkaufen", "Essen und Trinken", "Familie", "Freizeit", "Sport", "Reisen", "Verkehr", "Wohnen", "Arbeit", "Lernen und Bildung",
            "Gesundheit", "Umwelt", "Medien und Internet", "Feste und Veranstaltungen", "Alltag und Dienstleistungen");

    /** Suggested scenarios for Teil 3. */
    public static final List<String> PLANNING_TOPICS = List.of(
            "Einen Ausflug planen", "Ein Klassenfest organisieren", "Eine Geburtstagsfeier vorbereiten", "Ein Wochenende gemeinsam gestalten",
            "Einen Besuch organisieren", "Ein gemeinsames Essen planen", "Einen Umzug organisieren", "Eine Freizeitaktivität mit Freunden planen",
            "Eine Veranstaltung im Deutschkurs organisieren", "Einen Besuch für neue Kursteilnehmer vorbereiten");

    /** The Teil 3 format reference (hiking). It must not be copied into new exercises. */
    public static final List<String> HIKING_EXAMPLE_NOTES = List.of("Wohin?", "Was besichtigen?", "Übernachten?", "Essen?", "Wer soll kommen?");

    public static final List<String> LEVELS = List.of("A2", "A2_B1", "B1");

    /** The practice-support kinds of Teil 1 (separate from the fixed topics). */
    public static final Map<String, String> PRACTICE_FIELDS = Map.of(
            "question", "A simple question", "sentenceStarter", "A sample sentence starter", "vocabulary", "Useful A2–B1 vocabulary");

    public static String taskTypeOf(int part) {
        return switch (part) {
            case 1 -> TYPE_SELF_INTRODUCTION;
            case 2 -> TYPE_PHOTO_EXPERIENCE;
            default -> TYPE_JOINT_PLANNING;
        };
    }

    public static String titleOfPart(int part) {
        return switch (part) {
            case 1 -> "Teil 1 — Über sich sprechen";
            case 2 -> "Teil 2 — Über Erfahrungen sprechen";
            default -> "Teil 3 — Gemeinsam etwas planen";
        };
    }
}
