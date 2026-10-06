import type { ExamSection, ExamTaskType } from '@/types/exam';

export type ExamSectionMeta = {
  label: string;
  emoji: string;
  description: string;
  /** Accent colour of the section: icons, progress, headers. */
  color: string;
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
    color: '#3F86F0',
    description: 'Trainiere dein Leseverstehen im Prüfungsformat.',
  },
  SPRACHBAUSTEINE: {
    label: 'Sprachbausteine',
    emoji: '🧩',
    color: '#7B61D9',
    description: 'Übe Grammatik und Wortschatz im Prüfungsformat.',
  },
  HOERVERSTEHEN: {
    label: 'Hörverstehen',
    emoji: '🎧',
    color: '#E8832E',
    description: 'Trainiere dein Hörverstehen mit echten Prüfungsaufgaben.',
  },
  SCHRIFTLICHER_AUSDRUCK: {
    label: 'Schreiben',
    emoji: '✍️',
    color: '#2E8B57',
    description: 'Übe das Schreiben im Prüfungsformat.',
  },
  TESTFORMAT_INFORMATION: {
    label: 'Testformat',
    emoji: 'ℹ️',
    color: '#64748B',
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

/** One-line "how it works" per task type, shown before an exercise starts. */
export const TASK_HOWTO: Record<ExamTaskType, string> = {
  MATCHING: 'Ordne jedem Text die passende Überschrift zu.',
  SITUATION_MATCHING: 'Finde zu jeder Situation die passende Anzeige – oder x, wenn keine passt.',
  MULTIPLE_CHOICE: 'Lies den Text und wähle pro Aufgabe die richtige Antwort.',
  TRUE_FALSE_NOT_GIVEN: 'Entscheide: richtig, falsch oder nicht im Text?',
  WORD_BANK_CLOZE: 'Setze in jede Lücke das passende Wort. Nicht jedes Wort passt.',
  WRITING_TASK: 'Schreibe deinen Text und erhalte Feedback.',
};

export const HOEREN_HOWTO = 'Höre jeden Text und entscheide, ob die Aussage richtig (+) oder falsch (−) ist.';
