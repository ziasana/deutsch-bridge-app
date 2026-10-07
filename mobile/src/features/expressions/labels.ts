import type {
  ExpressionExampleContext,
  ExpressionMasteryLevel,
  ExpressionRegister,
  ExpressionType,
} from '@/types/expression';

export const TYPE_LABEL: Record<ExpressionType, string> = {
  REDEWENDUNG: 'Redewendungen',
  NOMEN_VERB_VERBINDUNG: 'Nomen-Verb-Verbindungen',
};

export const TYPE_SINGULAR: Record<ExpressionType, string> = {
  REDEWENDUNG: 'Redewendung',
  NOMEN_VERB_VERBINDUNG: 'Nomen-Verb-Verbindung',
};

export const TYPE_DESCRIPTION: Record<ExpressionType, string> = {
  REDEWENDUNG: 'Bildhafte Wendungen für natürliches Deutsch',
  NOMEN_VERB_VERBINDUNG: 'Feste Verbindungen für Beruf, Studium und Prüfung',
};

export const TYPE_EMOJI: Record<ExpressionType, string> = {
  REDEWENDUNG: '💬',
  NOMEN_VERB_VERBINDUNG: '🔗',
};

export const MASTERY_LABEL: Record<ExpressionMasteryLevel, string> = {
  NEW: 'Neu',
  LEARNING: 'Am Lernen',
  FAMILIAR: 'Vertraut',
  ACTIVE: 'Aktiv',
  MASTERED: 'Gemeistert',
};

export const MASTERY_ORDER: ExpressionMasteryLevel[] = [
  'NEW',
  'LEARNING',
  'FAMILIAR',
  'ACTIVE',
  'MASTERED',
];

export const REGISTER_LABEL: Record<ExpressionRegister, string> = {
  NEUTRAL_FORMAL: 'Neutral / formell',
  FORMAL: 'Formell',
  UMGANGSSPRACHLICH: 'Umgangssprachlich',
};

export const CONTEXT_LABEL: Record<ExpressionExampleContext, string> = {
  EVERYDAY: 'Alltag',
  WORK: 'Beruf',
  UNIVERSITY: 'Studium',
  SOCIETY: 'Gesellschaft',
  EXAM: 'Prüfung',
};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const SORT_LABEL = {
  recommended: 'Empfohlen',
  progress: 'Fortschritt',
  alphabetical: 'A–Z',
} as const;

/** Accent per mastery step: grey → blue → teal → green, so progress reads at a glance. */
export const MASTERY_COLOR: Record<ExpressionMasteryLevel, string> = {
  NEW: '#9AA3B5',
  LEARNING: '#D98E04',
  FAMILIAR: '#4D94FF',
  ACTIVE: '#27AE7A',
  MASTERED: '#1B7A55',
};

/** Accent for the whole expressions section: the same green as its tile in the learn tab. */
export const EXPRESSION_COLOR = '#27AE7A';
/** Darker shade for text and controls on the light green tint. */
export const EXPRESSION_DARK = '#1B7A55';

/** Accent per collection: one section colour, the emoji and label tell the two apart. */
export const TYPE_COLOR: Record<ExpressionType, string> = {
  REDEWENDUNG: EXPRESSION_COLOR,
  NOMEN_VERB_VERBINDUNG: EXPRESSION_COLOR,
};
