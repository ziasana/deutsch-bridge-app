import { ApiError } from '@/api/errors';
import type { BlockedReason, ResultStatus, SimSection } from '@/types/examSimulation';

/** Points with at most one decimal place, German decimal comma: 7.5 -> "7,5", 25 -> "25". */
export function formatPoints(value: number | null | undefined): string {
  if (value == null) return '–';
  const rounded = Math.round(value * 10) / 10;
  return String(rounded).replace('.', ',');
}

export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

export const formatDuration = (seconds: number | null | undefined): string =>
  seconds == null ? '–' : `${Math.round(seconds / 60)} Min.`;

export function formatDateTime(ms: number | null | undefined): string {
  if (ms == null) return '–';
  return new Date(ms).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

export const RESULT_LABEL: Record<ResultStatus, string> = {
  PASSED: 'Bestanden',
  NOT_PASSED: 'Nicht bestanden',
  AWAITING_ASSESSMENT: 'Bewertung steht noch aus',
  NOT_ASSESSED: 'Nicht bewertet',
  INCOMPLETE: 'Unvollständig',
};

export const RESULT_TONE: Record<ResultStatus, { fg: string; bg: string }> = {
  PASSED: { fg: '#1B7A55', bg: '#E4F6EE' },
  NOT_PASSED: { fg: '#C23030', bg: '#FDE8E8' },
  AWAITING_ASSESSMENT: { fg: '#9A6402', bg: '#FDF3DC' },
  NOT_ASSESSED: { fg: '#687083', bg: '#F1F3F7' },
  INCOMPLETE: { fg: '#9A6402', bg: '#FDF3DC' },
};

/** Why the overall result is what it is, so a missing assessment is never left unexplained. */
export const OVERALL_EXPLANATION: Record<string, string> = {
  ALL_PASSED: 'Schriftliche und mündliche Prüfung sind bestanden.',
  WRITTEN_NOT_PASSED:
    'Die schriftliche Prüfung wurde nicht bestanden. Damit ist die Gesamtprüfung nicht bestanden.',
  WRITTEN_ASSESSMENT_PENDING:
    'Die schriftliche Prüfung kann noch nicht bewertet werden, weil der Schriftliche Ausdruck noch nicht beurteilt wurde. Das Ergebnis ist vorläufig.',
  ORAL_NOT_ASSESSED:
    'Die schriftliche Prüfung ist bestanden. Die mündliche Prüfung ist in dieser Simulation nur eine Übung und wird nicht bewertet – deshalb kann kein Gesamtergebnis angegeben werden.',
  ORAL_ASSESSMENT_PENDING: 'Die mündliche Prüfung wartet noch auf ihre Bewertung.',
  ORAL_NOT_PASSED:
    'Die mündliche Prüfung wurde nicht bestanden. Damit ist die Gesamtprüfung nicht bestanden.',
  WRITTEN_RESULT_ONLY: 'Für dieses Prüfungsprofil entscheidet allein die schriftliche Prüfung.',
};

export const BLOCKED_REASON: Record<BlockedReason, string> = {
  ACTIVE_ATTEMPT: 'Du hast bereits eine Prüfung begonnen.',
  PROFILE_INVALID: 'Dieses Prüfungsprofil ist derzeit nicht verfügbar.',
  INSUFFICIENT_CONTENT:
    'Für ein neues Prüfungsset fehlen noch ungenutzte Aufgaben. Bereits verwendete Aufgaben werden nie wiederholt.',
};

/** Section look: colour (shared with the Übung screens), icon and short name. */
export const SIM_SECTION: Record<
  SimSection,
  { color: string; icon: 'book-outline' | 'extension-puzzle-outline' | 'headset-outline' | 'create-outline' | 'mic-outline' | 'information-circle-outline'; label: string }
> = {
  LESEVERSTEHEN: { color: '#3F86F0', icon: 'book-outline', label: 'Leseverstehen' },
  SPRACHBAUSTEINE: { color: '#7B61D9', icon: 'extension-puzzle-outline', label: 'Sprachbausteine' },
  HOERVERSTEHEN: { color: '#E8832E', icon: 'headset-outline', label: 'Hörverstehen' },
  SCHRIFTLICHER_AUSDRUCK: { color: '#0E9AA7', icon: 'create-outline', label: 'Schriftlicher Ausdruck' },
  MUENDLICHER_AUSDRUCK: { color: '#E0457B', icon: 'mic-outline', label: 'Mündlicher Ausdruck' },
  TESTFORMAT_INFORMATION: { color: '#64748B', icon: 'information-circle-outline', label: 'Testformat' },
};

/** A message for any failure; the exam API's own wording is kept for 4xx. */
export function simulationErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === 'INSUFFICIENT_CONTENT') return BLOCKED_REASON.INSUFFICIENT_CONTENT;
  if (error.code === 'ACTIVE_ATTEMPT_EXISTS') return BLOCKED_REASON.ACTIVE_ATTEMPT;
  return error.kind === 'network' || error.kind === 'server' ? error.message : error.message || fallback;
}

export const REJECTION_TEXT: Record<string, string> = {
  SECTION_LOCKED:
    'Die Zeit für diesen Abschnitt ist abgelaufen – die letzte Eingabe wurde nicht mehr gespeichert.',
  SECTION_NOT_STARTED: 'Dieser Abschnitt hat noch nicht begonnen.',
};

/** Ids of the pseudo-questions of free-text and oral parts (as the backend expects). */
export const WRITING_TEXT_ID = '__text';
export const DONE_ID = '__done';

export const countWords = (text: string): number => {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
};
