/**
 * DTZ A2–B1 Mündliche Prüfung. The three Teile have three different structures; the content is stored in the import-file shape
 * (`metadata.dtzOral`) and delivered to learners without admin-only fields (the image prompt is not part of a learner's content).
 */
export type DtzOralPart = 1 | 2 | 3;

export const DTZ_ORAL_PARTS: { part: DtzOralPart; label: string; title: string; exerciseType: string }[] = [
    { part: 1, label: "Teil 1", title: "Über sich sprechen", exerciseType: "SELF_INTRODUCTION" },
    { part: 2, label: "Teil 2", title: "Über Erfahrungen sprechen", exerciseType: "PHOTO_EXPERIENCE" },
    { part: 3, label: "Teil 3", title: "Gemeinsam etwas planen", exerciseType: "JOINT_PLANNING" },
];

/** The fixed examination topics of Teil 1, in order. They cannot be changed. */
export const TEIL1_TOPICS = ["Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen"] as const;

export const TEIL1_INSTRUCTIONS = "Stellen Sie sich Ihrer Gesprächspartnerin oder Ihrem Gesprächspartner vor. Sprechen Sie über die folgenden Themen:";
export const PARTICIPANT_A_TITLE = "Bildbeschreibung";
export const PARTICIPANT_A_INSTRUCTIONS = "Sie haben in einer Zeitschrift ein Foto gefunden. Berichten Sie Ihrer Gesprächspartnerin oder Ihrem Gesprächspartner kurz:";
export const PICTURE_PROMPTS = ["Was sehen Sie auf dem Foto?", "Was für eine Situation zeigt dieses Bild?"] as const;
export const PARTICIPANT_B_TITLE = "Eigene Erfahrungen";
export const PARTICIPANT_B_INSTRUCTIONS = "Erzählen Sie bitte: Welche Erfahrungen haben Sie damit?";
export const TASK_INSTRUCTION = "Planen Sie gemeinsam, was Sie tun wollen.";
export const QUESTIONS_PER_LEVEL = 4;
export const MIN_NOTES = 4;
export const MAX_NOTES = 6;
export const MIN_SOLUTION_TURNS = 4;
export const MAX_SOLUTION_TURNS = 20;

/** Suggested content categories of Teil 2 and scenarios of Teil 3 (the topic itself is free text). */
export const PHOTO_TOPICS = [
    "Einkaufen", "Essen und Trinken", "Familie", "Freizeit", "Sport", "Reisen", "Verkehr", "Wohnen", "Arbeit", "Lernen und Bildung",
    "Gesundheit", "Umwelt", "Medien und Internet", "Feste und Veranstaltungen", "Alltag und Dienstleistungen",
];
export const PLANNING_TOPICS = [
    "Einen Ausflug planen", "Ein Klassenfest organisieren", "Eine Geburtstagsfeier vorbereiten", "Ein Wochenende gemeinsam gestalten",
    "Einen Besuch organisieren", "Ein gemeinsames Essen planen", "Einen Umzug organisieren", "Eine Freizeitaktivität mit Freunden planen",
    "Eine Veranstaltung im Deutschkurs organisieren", "Einen Besuch für neue Kursteilnehmer vorbereiten",
];

export const DTZ_ORAL_LEVELS: [string, string][] = [["A2", "A2"], ["A2_B1", "A2–B1"], ["B1", "B1"]];

export interface DtzOralExplanation {
    de?: string;
    en?: string;
    fa?: string;
}

export interface DtzOralTopic {
    number: number;
    label: string;
}

export interface DtzOralPractice {
    topicNumber: number;
    question: string | null;
    sentenceStarter: string | null;
    vocabulary: string[];
    explanation?: DtzOralExplanation;
}

export interface DtzOralTeil1 {
    part: 1;
    languageLevel?: string;
    instructions: string;
    guidance: string | null;
    explanation?: DtzOralExplanation;
    topics: DtzOralTopic[];
    practiceSupport: DtzOralPractice[];
}

export interface DtzOralImage {
    imageUrl: string | null;
    /** Admin only - never part of a learner's content. */
    imagePrompt?: string | null;
    altText: string | null;
}

/** Teil 2 "Mögliche Lösung": one possible answer per task. Examples only, never the one correct answer. */
export interface DtzOralSolution {
    description: string | null;
    experienceA2: string | null;
    experienceB1: string | null;
}

export interface DtzOralTeil2 {
    part: 2;
    languageLevel?: string;
    topic: string;
    image: DtzOralImage;
    participantA: { title: string; instructions: string; questions: string[] };
    participantB: { title: string; instructions: string; questionsA2: string[]; questionsB1: string[] };
    possibleSolution?: DtzOralSolution | null;
}

/** Teil 3 "Mögliche Lösung": one possible planning conversation. An example only, never the one correct plan. */
export interface DtzOralDialogueTurn {
    speaker: "A" | "B";
    text: string;
}

export interface DtzOralTeil3 {
    part: 3;
    languageLevel?: string;
    topic: string;
    situation: string;
    taskInstruction: string;
    planningNotes: DtzOralTopic[];
    learnerSupport?: { examplePhrases?: string[] };
    possibleSolution?: { dialogue: DtzOralDialogueTurn[] } | null;
}

export type DtzOralContent = DtzOralTeil1 | DtzOralTeil2 | DtzOralTeil3;

/** Practice mode of Teil 2: the same photo with the A2 questions, the B1 questions, or both mixed. */
export type PracticeMode = "A2" | "B1" | "MIXED";
