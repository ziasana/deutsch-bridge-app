import type {
  WritingFeedbackStatus,
  WritingFormality,
  WritingGuideItem,
  WritingGuideKind,
  WritingHelpTab,
  WritingLearningResponse,
  WritingMode,
  WritingPhrase,
} from '@/types/writing';

export const WRITING_MODES: { mode: WritingMode; label: string; hint: string }[] = [
  { mode: 'LEARN', label: 'Lernen', hint: 'Alle Hilfen verfügbar' },
  { mode: 'PRACTICE', label: 'Üben', hint: 'Tipp & Redemittel' },
  { mode: 'EXAM', label: 'Prüfung', hint: 'Keine Hilfe' },
];

/** Which help tabs each mode offers: the one place that decides how much support a mode gives. */
export const HELP_TABS_BY_MODE: Record<WritingMode, WritingHelpTab[]> = {
  LEARN: ['TIP', 'EXAMPLE', 'PHRASES', 'MISTAKES'],
  PRACTICE: ['TIP', 'PHRASES'],
  EXAM: [],
};

export const HELP_TAB_LABELS: Record<WritingHelpTab, string> = {
  TIP: '💡 Tipp',
  EXAMPLE: '📖 Beispiel',
  PHRASES: '💬 Redemittel',
  MISTAKES: '⚠️ Häufige Fehler',
};

export const FORMALITY_LABELS: Record<WritingFormality, string> = {
  INFORMAL: 'informell',
  NEUTRAL: 'neutral',
  FORMAL: 'formell',
};

export const STATUS_META: Record<WritingFeedbackStatus, { label: string; glyph: string }> = {
  GOOD: { label: 'Gut', glyph: '✓' },
  OK: { label: 'Teilweise gut', glyph: '–' },
  IMPROVE: { label: 'Zum Verbessern', glyph: '!' },
  NOT_ASSESSED: { label: 'Selbst prüfen', glyph: '○' },
};

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function itemsOfKind<D>(
  data: WritingLearningResponse | undefined,
  kind: WritingGuideKind,
): WritingGuideItem<D>[] {
  return (data?.items ?? [])
    .filter((i) => i.kind === kind)
    .sort((a, b) => a.sortOrder - b.sortOrder) as WritingGuideItem<D>[];
}

/** The functions present in `phrases` (id → label), in the order the server sent them. */
export function phraseCategoryLabels(phrases: WritingPhrase[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const p of phrases) labels[p.category] ??= p.categoryLabel;
  return labels;
}

/** Whether a help tab has content for this level. */
export function helpTabHasContent(data: WritingLearningResponse, tab: WritingHelpTab): boolean {
  switch (tab) {
    case 'TIP':
      return itemsOfKind(data, 'STRATEGY_STEP').length > 0;
    case 'EXAMPLE':
      return itemsOfKind(data, 'EXAMPLE').length > 0;
    case 'PHRASES':
      return data.phrases.length > 0;
    case 'MISTAKES':
      return itemsOfKind(data, 'MISTAKE').length > 0;
  }
}
