import type { ExamExerciseSummary, ExamSection } from '@/types/exam';
import {
  PRACTICABLE_SECTIONS,
  SPRACHBAUSTEINE_LABELS,
  TASK_TYPE_LABELS,
  SECTION_META,
} from './examMeta';

export type PartState = 'not_started' | 'in_progress' | 'completed';

/** Last score when there is one; exercises without a quiz count as 100 once marked completed. */
export function effectiveScore(item: ExamExerciseSummary): number {
  if (item.lastScore != null) return item.lastScore;
  return item.completed ? 100 : 0;
}

export function averageScore(items: ExamExerciseSummary[]): number {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, i) => sum + effectiveScore(i), 0) / items.length);
}

export const masteredCount = (items: ExamExerciseSummary[]) =>
  items.filter((i) => effectiveScore(i) === 100).length;

export function partStateOf(mastered: number, total: number, attempted: number): PartState {
  if (total > 0 && mastered === total) return 'completed';
  if (attempted > 0) return 'in_progress';
  return 'not_started';
}

export interface ExamPartGroup {
  key: string;
  /** "Teil 1 – Zuordnungsaufgaben" */
  label: string;
  heading: string;
  subheading?: string;
  items: ExamExerciseSummary[];
  mastered: number;
  total: number;
  avgScore: number;
  state: PartState;
}

function buildGroup(
  key: string,
  label: string,
  heading: string,
  subheading: string | undefined,
  items: ExamExerciseSummary[],
): ExamPartGroup {
  // The API returns no defined order; "1. Übung" < "2. Übung" < "10. Übung".
  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title, 'de', { numeric: true }));
  const mastered = masteredCount(sorted);
  return {
    key,
    label,
    heading,
    subheading,
    items: sorted,
    mastered,
    total: sorted.length,
    avgScore: averageScore(sorted),
    state: partStateOf(mastered, sorted.length, sorted.filter((e) => e.completed).length),
  };
}

/** Exercises of one section at a level (exercises without a level apply to every level). */
export const exercisesForSectionAndLevel = (
  exercises: ExamExerciseSummary[],
  section: ExamSection,
  level: string,
) => exercises.filter((e) => e.section === section && (e.level === level || e.level == null));

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

/** Groups a section's exercises into ordered "Teil" cards (same rules as the web app). */
export function groupIntoParts(
  items: ExamExerciseSummary[],
  section: ExamSection,
): ExamPartGroup[] {
  if (section === 'LESEVERSTEHEN' || section === 'HOERVERSTEHEN') {
    const fallback = SECTION_META[section].label;
    return [...groupBy(items, (e) => String(e.partNumber ?? 1)).entries()]
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, group]) => {
        const taskType = group[0]?.taskType ?? null;
        const suffix = (taskType && TASK_TYPE_LABELS[taskType]) || fallback;
        return buildGroup(key, `Teil ${key} – ${suffix}`, `Teil ${key}`, suffix, group);
      });
  }

  if (section === 'SPRACHBAUSTEINE') {
    const order = ['MULTIPLE_CHOICE', 'WORD_BANK_CLOZE'];
    const byTask = groupBy(items, (e) => e.taskType ?? 'OTHER');
    const keys = [...order, ...[...byTask.keys()].filter((k) => !order.includes(k))].filter((k) =>
      byTask.has(k),
    );
    return keys.map((key, index) => {
      const group = byTask.get(key)!;
      const taskType = group[0]?.taskType ?? null;
      const label = SPRACHBAUSTEINE_LABELS[key as keyof typeof SPRACHBAUSTEINE_LABELS] ?? key;
      return buildGroup(
        key,
        label,
        `Teil ${index + 1}`,
        (taskType && TASK_TYPE_LABELS[taskType]) || undefined,
        group,
      );
    });
  }

  if (section === 'SCHRIFTLICHER_AUSDRUCK') {
    return items.length === 0
      ? []
      : [buildGroup(section, 'Schriftlicher Ausdruck', 'Schriftlicher Ausdruck', undefined, items)];
  }

  return []; // Testformat is a flat informational list
}

export function findGroupByKey(
  exercises: ExamExerciseSummary[],
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

function pickGroupToContinue(groups: ExamPartGroup[]): ExamPartGroup | undefined {
  const inProgress = groups.filter((g) => g.state === 'in_progress');
  if (inProgress.length > 0) {
    return inProgress.reduce((best, g) => (g.avgScore > best.avgScore ? g : best));
  }
  return groups.find((g) => g.state === 'not_started');
}

const toTarget = (
  section: ExamSection,
  group: ExamPartGroup,
  exerciseId: string,
): ContinueTarget => ({
  exerciseId,
  section,
  partLabel: group.label,
  mastered: group.mastered,
  total: group.total,
  avgScore: group.avgScore,
  state: group.state,
});

/**
 * The part to resume: the best unfinished Teil of the preferred section, else of any practicable
 * section, else the preferred section's last Teil for review.
 */
export function findContinueTarget(
  exercises: ExamExerciseSummary[],
  level: string,
  preferred: ExamSection,
): ContinueTarget | null {
  const sections = [preferred, ...PRACTICABLE_SECTIONS.filter((s) => s !== preferred)].filter((s) =>
    PRACTICABLE_SECTIONS.includes(s),
  );
  for (const section of sections) {
    const group = pickGroupToContinue(
      groupIntoParts(exercisesForSectionAndLevel(exercises, section, level), section),
    );
    if (group) {
      const exercise = group.items.find((e) => effectiveScore(e) < 100) ?? group.items[0];
      return toTarget(section, group, exercise.id);
    }
  }
  // Everything is mastered: offer the last Teil of the preferred (or first non-empty) section for review.
  for (const section of sections) {
    const groups = groupIntoParts(exercisesForSectionAndLevel(exercises, section, level), section);
    const last = groups[groups.length - 1];
    if (last) return { ...toTarget(section, last, last.items[0].id), state: 'completed' };
  }
  return null;
}
