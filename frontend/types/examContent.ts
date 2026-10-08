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
    taskType: "MATCHING" | "MULTIPLE_CHOICE" | "SITUATION_MATCHING";
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
