import type { DtzOralContent } from "./dtzOral";
import type { SpeakingContent } from "./exam";

/** Editorial lifecycle of an exam exercise; only PUBLISHED reaches learners. */
export type ExamContentStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export const EXAM_CONTENT_STATUSES: ExamContentStatus[] = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"];

export interface ExamContentSpecInfo {
    exam: string;
    level: string;
    section: string;
    sectionLabel: string;
    part: string;
    headingCount: number;
    textCount: number;
    label: string;
    taskType:
        | "MATCHING"
        | "MULTIPLE_CHOICE"
        | "SITUATION_MATCHING"
        | "DIRECTORY_MATCHING"
        | "TEXT_QUESTIONS"
        | "TEXT_TRUE_FALSE"
        | "LETTER_GAP_FILL"
        | "WORD_BANK_CLOZE"
        | "WRITING_TASK"
        | "WRITING_TASK_CHOICE"
        | "TOPIC_INTERVIEW"
        | "OPINION_DISCUSSION"
        | "JOINT_PLANNING"
        | "SELF_INTRODUCTION"
        | "PHOTO_EXPERIENCE";
    questionCount: number;
    optionCount: number;
}

export interface ExamContentOptions {
    specs: ExamContentSpecInfo[];
    exams: string[];
    topics: string[];
    difficulties: string[];
    statuses: ExamContentStatus[];
    schemaVersion: string;
    /** Sprachbausteine generator choices. */
    textTypes?: string[];
    grammarCategories?: string[];
    wordCategories?: string[];
    /** Schriftlicher Ausdruck generator choices. */
    scenarioTypes?: string[];
    relationships?: string[];
    communicationTypes?: string[];
    /** DTZ Lesen Teil 1 generator choices (first entry = default). */
    directoryTopics?: string[];
    directorySourceTypes?: string[];
    directoryLevels?: string[];
    directoryVariations?: string[];
    /** DTZ Lesen Teil 2 generator choices (first entry = default). */
    adTopics?: string[];
    adCategories?: string[];
    /** DTZ Lesen Teil 3 generator choices (first entry = default). */
    lesenTextTopics?: string[];
    lesenTextMixes?: string[];
    lesenTextTypes?: string[];
    lesenTextLengths?: string[];
}

export interface PromptRequest {
    exam: string;
    level: string;
    section: string;
    part: string;
    count: number;
    difficulty: string;
    topics: string[];
    notes?: string;
    /** Situation-matching parts (Lesen Teil 3): ask the AI for image briefs. */
    includeVisuals?: boolean;
    /** Sprachbausteine: preferred text type; omitted = varied. */
    textType?: string;
    /** Sprachbausteine: grammar categories to test; omitted = all. */
    grammarCategories?: string[];
    /** Sprachbausteine Teil 2: RANDOM | WITH_ADVERTISEMENT | WITHOUT_ADVERTISEMENT. */
    contextMode?: string;
    /** Sprachbausteine Teil 2: kinds of function words in the word bank; omitted = all. */
    wordCategories?: string[];
    /** Schriftlicher Ausdruck: RANDOM | STANDARD_EMAIL | ALTERNATIVE_EMAIL. */
    scenarioType?: string;
    /** Schriftlicher Ausdruck: omitted = chosen by the AI to fit the situation. */
    relationship?: string;
    communicationType?: string;
    /** DTZ Lesen Teil 1: DIRECTORY | REGISTER | CATALOGUE | SERVICE_LIST | RANDOM. */
    sourceType?: string;
    /** DTZ Lesen Teil 1: include the unscored example. */
    includeExample?: boolean;
    /** DTZ Lesen Teil 1: RANDOM | NEW_SCENARIO | AVOID_KNOWN_TOPICS. */
    variation?: string;
    /** DTZ Lesen Teil 2: advertisement categories; omitted = chosen by the AI. */
    adCategories?: string[];
    /** DTZ Lesen Teil 3: RANDOM_MIX | PRESS_EMAIL_NOTICE | THREE_PRESS | THREE_EMAILS | THREE_NOTICES | CUSTOM. */
    textMix?: string;
    /** DTZ Lesen Teil 3, textMix CUSTOM: the type of text 1, 2 and 3. */
    customTextTypes?: string[];
    /** DTZ Lesen Teil 3: SHORT | MEDIUM | LONG. */
    textLength?: string;
    /** DTZ Lesen Teil 3: include dates and times where appropriate. */
    includeDatesTimes?: boolean;
    /** DTZ Lesen Teil 3: optional metadata tags. */
    tags?: string[];
    /** DTZ Schreiben: DIFFERENT_TOPICS | DIFFERENT_PURPOSES | FORMAL_AND_INFORMAL | RANDOM_BALANCED. */
    pairPreference?: string;
}

export interface PromptResponse {
    prompt: string;
    promptVersion: string;
    schemaVersion: string;
    jsonExample: string;
    existingCount: number;
    firstExternalId: string;
}

export interface ContentIssue {
    severity: "ERROR" | "WARNING";
    code: string;
    path: string;
    message: string;
}

export interface ContentCheck {
    label: string;
    ok: boolean;
}

export interface PreviewHeading {
    id: string;
    text: string | null;
}

export interface PreviewText {
    id: string;
    content: string | null;
    correctHeadingId: string | null;
}

export interface PreviewQuestion {
    id: string | null;
    number: number | null;
    question: string | null;
    options: PreviewHeading[];
    correctOptionId: string | null;
    questionType: string | null;
}

export interface PreviewSituation {
    id: string | null;
    number: number | null;
    text: string | null;
    /** a–l, or x when no advertisement fits. */
    correctAdvertisementId: string | null;
    matchingProfile?: { primaryNeed?: string; requirements?: string[] } | null;
    /** DTZ Lesen Teil 2 (admin only): the German explanation of the answer, by language ("de"). */
    explanation?: Record<string, string> | null;
}

export interface AdvertisementContent {
    headline?: string;
    subheadline?: string;
    description?: string;
    details?: string[];
    price?: string;
    openingHours?: string;
    contact?: Record<string, string>;
}

export interface AdvertisementVisual {
    hasImage?: boolean;
    imageType?: string;
    imageUrl?: string | null;
    imagePrompt?: string | null;
    altText?: string | null;
}

export interface PreviewAdvertisement {
    id: string | null;
    type?: string | null;
    layout?: string | null;
    content: AdvertisementContent;
    visual?: AdvertisementVisual | null;
    matchingProfile?: { primaryService?: string; features?: string[] } | null;
}

/** Schriftlicher Ausdruck: the incoming email, the four points and how the task is classified. */
export interface PreviewWriting {
    taskType: string | null;
    scenarioType: string | null;
    topic: string | null;
    communicationType: string | null;
    relationship: string | null;
    situation: string | null;
    greeting: string | null;
    body: string | null;
    closing: string | null;
    sender: string | null;
    points: string[];
    writingGuidance: string | null;
    modelSubject?: string | null;
    modelBody?: string | null;
}

/** Mündlicher Ausdruck: the validated, German-only content of the part, exactly as the learner screens render it. */
export interface PreviewSpeaking {
    taskType: SpeakingContent["taskType"];
    topic: string | null;
    content: SpeakingContent;
}

/** DTZ Lesen Teil 1: the shared information source, the unscored example and (admin only) what supports each answer. */
export interface PreviewDirectory {
    sourceType: string | null;
    topic: string | null;
    languageLevel: string | null;
    sourceTitle: string | null;
    introduction: string | null;
    entries: { id: string; heading: string; details: string[] }[];
    displayText: string | null;
    example: { situation: string | null; options: PreviewHeading[]; correctOptionId: string | null; explanation: Record<string, string> } | null;
    questionDetails: { number: number | null; sourceEntryIds: string[]; explanation: Record<string, string> }[];
}

/** DTZ Lesen Teil 3: one task of a text. `options` is empty for TRUE_FALSE; `correctAnswer` is RICHTIG / FALSCH or a, b, c. */
export interface PreviewTextTask {
    number: number | null;
    type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | string;
    prompt: string | null;
    options: PreviewHeading[];
    correctAnswer: string | null;
    explanation: Record<string, string>;
}

export interface PreviewTextItem {
    id: string | null;
    number: number | null;
    type: string | null;
    title: string | null;
    sender: string | null;
    date: string | null;
    body: string | null;
    tasks: PreviewTextTask[];
}

/** DTZ Lesen Teil 3: the three texts with their two tasks each and the answer key (admin only). */
export interface PreviewTextQuestions {
    topic: string | null;
    languageLevel: string | null;
    texts: PreviewTextItem[];
}

/** DTZ Lesen Teil 5: the letter / email with its {{40}}..{{45}} markers, the unscored example gap and (admin only) what each gap tests. */
export interface PreviewLetter {
    type: string | null;
    topic: string | null;
    languageLevel: string | null;
    sender: string | null;
    recipient: string | null;
    date: string | null;
    subject: string | null;
    body: string | null;
    example: {
        textBeforeGap: string | null;
        textAfterGap: string | null;
        options: PreviewHeading[];
        correctOptionId: string | null;
        explanation: Record<string, string>;
    } | null;
    gaps: { number: number | null; grammarCategory: string | null; grammarFocus: string | null; explanation: Record<string, string> }[];
}

/** DTZ Schreiben: one alternative in the import-file shape; the same shape is sent to the editor endpoints. */
export interface PreviewWritingChoiceTask {
    label: string;
    title: string | null;
    topic: string | null;
    communicationType: string | null;
    situation: string | null;
    recipientName: string | null;
    recipientRole: string | null;
    writingInstruction: string | null;
    points: string[];
}

export interface PreviewWritingChoice {
    durationMinutes: number;
    languageLevel: string | null;
    tasks: PreviewWritingChoiceTask[];
}

export interface WritingChoiceSaveResult {
    id: string;
    warnings: ContentIssue[];
}

export interface ExercisePreviewData {
    title: string | null;
    instructions: string | null;
    headings: PreviewHeading[];
    texts: PreviewText[];
    /** Multiple-choice exercises (Lesen Teil 2): the one reading text and its questions. */
    readingText?: string | null;
    questions?: PreviewQuestion[];
    /** Situation-matching exercises (Lesen Teil 3). */
    situations?: PreviewSituation[];
    advertisements?: PreviewAdvertisement[];
    /** Word-bank exercises (Sprachbausteine Teil 2): the advertisement / information before the text; the words are in `headings`. */
    context?: { type: string; title: string; text: string } | null;
    /** Writing tasks (Schriftlicher Ausdruck). */
    writing?: PreviewWriting | null;
    /** Speaking tasks (Mündlicher Ausdruck). */
    speaking?: PreviewSpeaking | null;
    /** DTZ Lesen Teil 1 (directory matching): the questions are in `questions`, the source and answer-key details here. */
    directory?: PreviewDirectory | null;
    /** DTZ Lesen Teil 3 (texts with richtig/falsch + multiple choice): texts, tasks and answer key. */
    textQuestions?: PreviewTextQuestions | null;
    /** DTZ Lesen Teil 5 (letter with six gaps): the letter, the example and the answer key; the six gap questions are in `questions`. */
    letter?: PreviewLetter | null;
    /** DTZ Schreiben: Aufgabe A and Aufgabe B with four content points each. */
    writingChoice?: PreviewWritingChoice | null;
    /** DTZ Mündliche Prüfung: the Teil's content (admins also see the image prompt of Teil 2). */
    dtzOral?: PreviewDtzOral | null;
}

export interface PreviewDtzOral {
    part: 1 | 2 | 3;
    exerciseType: string;
    languageLevel: string | null;
    content: DtzOralContent;
}

export interface DtzOralSaveResult {
    id: string;
    warnings: ContentIssue[];
}

export interface DuplicateMatch {
    kind: "EXACT" | "SIMILAR" | "EXTERNAL_ID" | "BATCH_EXACT" | "BATCH_SIMILAR";
    newText: string | null;
    existingText: string | null;
    existingExerciseId: string | null;
    existingTitle: string | null;
    existingExternalId: string | null;
    similarity: number;
}

export type ExerciseReportState = "OK" | "SIMILAR" | "EXACT_DUPLICATE" | "EXTERNAL_ID_EXISTS" | "INVALID";

export interface ExerciseReport {
    index: number;
    externalId: string | null;
    title: string | null;
    valid: boolean;
    state: ExerciseReportState;
    importable: boolean;
    issues: ContentIssue[];
    duplicates: DuplicateMatch[];
    preview: ExercisePreviewData;
}

export interface ValidationReport {
    syntaxValid: boolean;
    valid: boolean;
    schemaVersion: string | null;
    contentType: string | null;
    exam: string | null;
    level: string | null;
    section: string | null;
    part: string | null;
    exerciseCount: number;
    headingCount: number;
    textCount: number;
    questionCount: number;
    importableCount: number;
    similarCount: number;
    duplicateCount: number;
    checks: ContentCheck[];
    issues: ContentIssue[];
    exercises: ExerciseReport[];
}

export interface ImportResult {
    imported: { index: number; id: string; externalId: string | null; title: string }[];
    skipped: { index: number; externalId: string | null; title: string | null; reason: string }[];
}

export interface StatusChangeResult {
    updated: number;
    failures: { id: string; title: string | null; reason: string }[];
}
