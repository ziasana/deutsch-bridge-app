import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Dictionary } from '@/i18n';
import type { ExamKind, Focus, Level, Reason } from './plan';
import type { PreferredLanguage } from '@/types/user';

type IconName = ComponentProps<typeof Ionicons>['name'];
export type Option<T> = {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  emoji?: string;
};

const REASON_ICONS: Record<Reason, IconName> = {
  WORK: 'briefcase-outline',
  EVERYDAY_LIFE: 'home-outline',
  STUDY: 'school-outline',
  COMMUNICATION: 'chatbubbles-outline',
  EXAM: 'ribbon-outline',
  LIVING_IN_GERMANY: 'location-outline',
  PERSONAL_INTEREST: 'heart-outline',
};

const FOCUS_ICONS: Record<Focus, IconName> = {
  VOCABULARY: 'book-outline',
  GRAMMAR: 'extension-puzzle-outline',
  SPEAKING: 'mic-outline',
  LISTENING: 'ear-outline',
  READING: 'reader-outline',
  WRITING: 'create-outline',
  EXPRESSIONS: 'chatbox-ellipses-outline',
  EXAM: 'clipboard-outline',
};

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const EXAM_KINDS: [ExamKind, string | null][] = [
  ['TELC', 'TELC'],
  ['GOETHE', 'Goethe'],
  ['TESTDAF', 'TestDaF'],
  ['DSH', 'DSH'],
  ['OTHER', null],
];
export const DAILY_WORD_VALUES = [5, 10, 15, 20];

/** The wizard's answer lists, labelled in the current interface language. */
export function buildOptions(o: Dictionary['entry']['onboarding']) {
  return {
    languages: (['EN', 'PR'] as PreferredLanguage[]).map((value): Option<PreferredLanguage> => ({
      value,
      ...o.languages[value as 'EN' | 'PR'],
      emoji: value === 'EN' ? '🇬🇧' : '🇮🇷',
    })),
    reasons: (Object.keys(REASON_ICONS) as Reason[]).map((value): Option<Reason> => ({
      value,
      ...o.reasons[value],
      icon: REASON_ICONS[value],
    })),
    levels: LEVELS.map((value): Option<Level> => ({ value, ...o.levels[value] })),
    focus: (Object.keys(FOCUS_ICONS) as Focus[]).map((value): Option<Focus> => ({
      value,
      ...o.focus[value],
      icon: FOCUS_ICONS[value],
    })),
    exams: EXAM_KINDS.map(([value, name]): Option<ExamKind> => ({
      value,
      label: name ?? o.exams.OTHER,
    })),
    dailyWords: DAILY_WORD_VALUES.map((value): Option<number> => ({
      value,
      label: o.words(value),
      description: o.pace[value],
    })),
  };
}
