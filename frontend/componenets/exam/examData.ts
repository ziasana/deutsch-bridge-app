import { ExamExercisePublicResponse, ExamSection } from "@/types/exam";
import { LearningLevelOption } from "@/componenets/learning";
import { SPRACHBAUSTEINE_TASK_TYPE_LABELS, TASK_TYPE_LABELS } from "./examMeta";

const SECTION_FALLBACK_LABEL: Partial<Record<ExamSection, string>> = {
    LESEVERSTEHEN: "Leseverstehen",
    HOERVERSTEHEN: "Hörverstehen",
};

export type PartState = "not_started" | "in_progress" | "completed";

/**
 * An exercise's score for progress purposes: its actual last score when one exists, or - for
 * exercise types with no quiz/score at all (Schriftlicher Ausdruck, Testformat) - full credit
 * once marked completed, matching how those types have always signalled "done".
 */
export function effectiveScore(item: ExamExercisePublicResponse): number {
    if (item.lastScore != null) return item.lastScore;
    return item.completed ? 100 : 0;
}

/** Average effective score (0-100) across a set of exercises. */
export function averageScore(items: ExamExercisePublicResponse[]): number {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + effectiveScore(item), 0);
    return Math.round(sum / items.length);
}

/** How many exercises have been fully mastered (effective score of 100). */
export function masteredCount(items: ExamExercisePublicResponse[]): number {
    return items.filter((item) => effectiveScore(item) === 100).length;
}

export function partStateOf(mastered: number, total: number, attempted: number): PartState {
    if (total > 0 && mastered === total) return "completed";
    if (attempted > 0) return "in_progress";
    return "not_started";
}

export interface ExamPartGroup {
    key: string;
    /** Combined "Teil N – Suffix" label used in the compact Teil row. */
    label: string;
    /** Short title for the Teil-detail page header, e.g. "Teil 1". */
    heading: string;
    /** Task-type description shown under the heading, e.g. "Überschriften zuordnen". */
    subheading?: string;
    items: ExamExercisePublicResponse[];
    /** Count of exercises scored 100%. */
    mastered: number;
    total: number;
    /** Average effective score (0-100) across all exercises in this Teil. */
    avgScore: number;
    state: PartState;
}

function buildGroup(key: string, label: string, heading: string, subheading: string | undefined, groupItems: ExamExercisePublicResponse[]): ExamPartGroup {
    const mastered = masteredCount(groupItems);
    const attempted = groupItems.filter((e) => e.completed).length;
    return {
        key,
        label,
        heading,
        subheading,
        items: groupItems,
        mastered,
        total: groupItems.length,
        avgScore: averageScore(groupItems),
        state: partStateOf(mastered, groupItems.length, attempted),
    };
}

/** Exercises belonging to a section for a given level (null-level exercises apply to every level). */
export function exercisesForSectionAndLevel(
    exercises: ExamExercisePublicResponse[],
    section: ExamSection,
    level: string,
): ExamExercisePublicResponse[] {
    return exercises.filter((e) => e.section === section && (e.level === level || e.level == null));
}

/** Groups a section's exercises into ordered "Teil" cards. Mirrors the previous flat page's grouping rules. */
export function groupIntoParts(items: ExamExercisePublicResponse[], section: ExamSection): ExamPartGroup[] {
    if (section === "LESEVERSTEHEN" || section === "HOERVERSTEHEN") {
        const sectionLabel = SECTION_FALLBACK_LABEL[section]!;
        const byPart = new Map<string, ExamExercisePublicResponse[]>();
        items.forEach((e) => {
            const key = String(e.partNumber ?? 1);
            (byPart.get(key) ?? byPart.set(key, []).get(key)!).push(e);
        });
        return Array.from(byPart.entries())
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([key, groupItems]) => {
                const taskType = groupItems[0]?.taskType ?? null;
                const suffix = (taskType && TASK_TYPE_LABELS[taskType]) || sectionLabel;
                return buildGroup(key, `Teil ${key} – ${suffix}`, `Teil ${key}`, suffix, groupItems);
            });
    }

    if (section === "SPRACHBAUSTEINE") {
        const order = ["MULTIPLE_CHOICE", "WORD_BANK_CLOZE"] as const;
        const byTask = new Map<string, ExamExercisePublicResponse[]>();
        items.forEach((e) => {
            const key = e.taskType ?? "OTHER";
            (byTask.get(key) ?? byTask.set(key, []).get(key)!).push(e);
        });
        return [...order, ...Array.from(byTask.keys()).filter((k) => !(order as readonly string[]).includes(k))]
            .filter((key) => byTask.has(key))
            .map((key, index) => {
                const groupItems = byTask.get(key)!;
                const taskType = groupItems[0]?.taskType ?? null;
                const label = SPRACHBAUSTEINE_TASK_TYPE_LABELS[key as keyof typeof SPRACHBAUSTEINE_TASK_TYPE_LABELS] ?? key;
                return buildGroup(key, label, `Teil ${index + 1}`, (taskType && TASK_TYPE_LABELS[taskType]) || undefined, groupItems);
            });
    }

    if (section === "SCHRIFTLICHER_AUSDRUCK") {
        if (items.length === 0) return [];
        return [buildGroup("SCHRIFTLICHER_AUSDRUCK", "Schriftlicher Ausdruck", "Schriftlicher Ausdruck", undefined, items)];
    }

    // TESTFORMAT_INFORMATION is rendered as a flat informational list, not part groups.
    return [];
}

/** Looks up a single Teil group by its key, for the Teil-detail page's URL params. */
export function findGroupByKey(
    exercises: ExamExercisePublicResponse[],
    section: ExamSection,
    level: string,
    key: string,
): ExamPartGroup | null {
    const groups = groupIntoParts(exercisesForSectionAndLevel(exercises, section, level), section);
    return groups.find((g) => g.key === key) ?? null;
}

export interface ContinueTarget {
    exerciseId: string;
    section: ExamSection;
    partLabel: string;
    mastered: number;
    total: number;
    avgScore: number;
    state: PartState;
}

/**
 * Picks which not-fully-mastered Teil to resume within a section: the in-progress Teil with the
 * most actual headway (highest average score) wins, since that's the closest to being finished;
 * ties (and the case where nothing has been attempted yet) fall back to Teil order.
 */
function pickGroupToContinue(groups: ExamPartGroup[]): ExamPartGroup | undefined {
    const inProgress = groups.filter((g) => g.state === "in_progress");
    if (inProgress.length > 0) {
        return inProgress.reduce((best, g) => (g.avgScore > best.avgScore ? g : best));
    }
    return groups.find((g) => g.state === "not_started");
}

/**
 * Deterministic "Weiterlernen" pick: the best not-fully-mastered part of the preferred section,
 * falling back to the best not-fully-mastered part of any practicable section at this level,
 * falling back to the preferred section's last part (fully mastered) for review.
 */
export function findContinueTarget(
    exercises: ExamExercisePublicResponse[],
    level: string,
    preferredSection: ExamSection,
): ContinueTarget | null {
    const practicable = EXAM_TYPE_ORDER_PRACTICABLE;
    const sectionsToTry = [preferredSection, ...practicable.filter((s) => s !== preferredSection)];

    for (const section of sectionsToTry) {
        const groups = groupIntoParts(exercisesForSectionAndLevel(exercises, section, level), section);
        const unmastered = pickGroupToContinue(groups);
        if (unmastered) {
            const target = unmastered.items.find((e) => effectiveScore(e) < 100) ?? unmastered.items[0];
            return {
                exerciseId: target.id,
                section,
                partLabel: unmastered.label,
                mastered: unmastered.mastered,
                total: unmastered.total,
                avgScore: unmastered.avgScore,
                state: unmastered.state,
            };
        }
    }

    // Everything is mastered: offer to review the preferred section's last part.
    const preferredGroups = groupIntoParts(exercisesForSectionAndLevel(exercises, preferredSection, level), preferredSection);
    const last = preferredGroups[preferredGroups.length - 1];
    if (last) {
        return {
            exerciseId: last.items[0].id,
            section: preferredSection,
            partLabel: last.label,
            mastered: last.mastered,
            total: last.total,
            avgScore: last.avgScore,
            state: "completed",
        };
    }
    return null;
}

const EXAM_TYPE_ORDER_PRACTICABLE: ExamSection[] = [
    "LESEVERSTEHEN",
    "SPRACHBAUSTEINE",
    "HOERVERSTEHEN",
    "SCHRIFTLICHER_AUSDRUCK",
];

/** Per-level aggregate progress across every practicable section, for the level selector. */
export function buildLevelOptions(exercises: ExamExercisePublicResponse[]): LearningLevelOption[] {
    const levels = Array.from(
        new Set(
            exercises
                .filter((e) => e.section !== "TESTFORMAT_INFORMATION" && e.level != null)
                .map((e) => e.level as string),
        ),
    ).sort();

    return levels.map((level) => {
        const inLevel = exercises.filter((e) => e.section !== "TESTFORMAT_INFORMATION" && e.level === level);
        return {
            level,
            total: inLevel.length,
            completed: masteredCount(inLevel),
            percentOverride: averageScore(inLevel),
        };
    });
}
