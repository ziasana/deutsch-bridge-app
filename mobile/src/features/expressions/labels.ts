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
