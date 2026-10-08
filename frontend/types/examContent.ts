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

export interface ExercisePreviewData {
    title: string | null;
    instructions: string | null;
    headings: PreviewHeading[];
    texts: PreviewText[];
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
