import type { ExamSection, ExamTaskType } from '@/types/exam';

export type ExamSectionMeta = {
  label: string;
  emoji: string;
  description: string;
  /** Informational sections (Testformat) have no progress. */
  informational?: boolean;
};

export const SECTION_ORDER: ExamSection[] = [
  'LESEVERSTEHEN',
  'SPRACHBAUSTEINE',
  'HOERVERSTEHEN',
  'SCHRIFTLICHER_AUSDRUCK',
  'TESTFORMAT_INFORMATION',
];

/** Sections with quizzes and a score; used for "continue" suggestions. */
export const PRACTICABLE_SECTIONS: ExamSection[] = [
  'LESEVERSTEHEN',
  'SPRACHBAUSTEINE',
  'HOERVERSTEHEN',
];

export const SECTION_META: Record<ExamSection, ExamSectionMeta> = {
  LESEVERSTEHEN: {
    label: 'Lesen',
    emoji: '📖',
    description: 'Trainiere dein Leseverstehen im Prüfungsformat.',
  },
  SPRACHBAUSTEINE: {
    label: 'Sprachbausteine',
    emoji: '🧩',
    description: 'Übe Grammatik und Wortschatz im Prüfungsformat.',
  },
  HOERVERSTEHEN: {
    label: 'Hörverstehen',
    emoji: '🎧',
    description: 'Trainiere dein Hörverstehen mit echten Prüfungsaufgaben.',
  },
  SCHRIFTLICHER_AUSDRUCK: {
    label: 'Schreiben',
    emoji: '✍️',
    description: 'Übe das Schreiben im Prüfungsformat.',
  },
  TESTFORMAT_INFORMATION: {
    label: 'Testformat',
    emoji: 'ℹ️',
    description: 'Prüfungsaufbau, Punkte, Dauer und mehr.',
    informational: true,
  },
};

export const TASK_TYPE_LABELS: Record<ExamTaskType, string> = {
  MATCHING: 'Zuordnungsaufgaben',
  SITUATION_MATCHING: 'Zuordnung: Situation → Anzeige',
  MULTIPLE_CHOICE: 'Multiple-Choice-Aufgaben',
  TRUE_FALSE_NOT_GIVEN: 'Aufgaben richtig/falsch/nicht',
  WORD_BANK_CLOZE: 'Lückentext (Wortbank)',
  WRITING_TASK: 'Schriftlicher Ausdruck',
};

export const SPRACHBAUSTEINE_LABELS: Partial<Record<ExamTaskType, string>> = {
  MULTIPLE_CHOICE: 'Sprachbausteine Teil 1',
  WORD_BANK_CLOZE: 'Sprachbausteine Teil 2',
};

export const TFN_OPTIONS = [
  { value: 'RICHTIG', label: 'Richtig' },
  { value: 'FALSCH', label: 'Falsch' },
  { value: 'NICHT_IM_TEXT', label: 'Nicht im Text' },
];
