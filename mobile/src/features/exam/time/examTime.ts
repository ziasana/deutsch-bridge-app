import type { ExamSection } from '@/types/exam';

export interface TimeThresholds {
  approaching: number;
  target: number;
  overTime: number;
}

/** Feedback thresholds as fractions of the target. Change them here only. */
export const TIME_THRESHOLDS: TimeThresholds = { approaching: 0.8, target: 1, overTime: 1.25 };

/** Sections with a Teil timer. Hörverstehen is paced by its audio, so it gets none. */
export const TIMED_SECTIONS: readonly ExamSection[] = [
  'LESEVERSTEHEN',
  'SPRACHBAUSTEINE',
  'SCHRIFTLICHER_AUSDRUCK',
];

export type TimeStatus = 'ON_TRACK' | 'TARGET_REACHED' | 'OVER_TIME';

export interface TimeStatusResult {
  status: TimeStatus;
  elapsedSeconds: number;
  targetSeconds: number;
  /** elapsed − target: negative while under target, positive once over. */
  differenceSeconds: number;
}

/** 20:00 target → 19:59 on track, 20:00 reached, 25:00 reached, 25:01 over. */
export function getTimeStatus(
  elapsedSeconds: number,
  targetSeconds: number,
  t: TimeThresholds = TIME_THRESHOLDS,
): TimeStatusResult {
  let status: TimeStatus = 'ON_TRACK';
  if (elapsedSeconds > targetSeconds * t.overTime) status = 'OVER_TIME';
  else if (elapsedSeconds >= targetSeconds * t.target) status = 'TARGET_REACHED';
  return { status, elapsedSeconds, targetSeconds, differenceSeconds: elapsedSeconds - targetSeconds };
}

export type WarningStage = 'APPROACHING' | 'TARGET_REACHED' | 'OVER_TIME';
const STAGE_ORDER: WarningStage[] = ['APPROACHING', 'TARGET_REACHED', 'OVER_TIME'];

export function currentWarningStage(elapsed: number, target: number): WarningStage | null {
  const { status } = getTimeStatus(elapsed, target);
  if (status === 'OVER_TIME') return 'OVER_TIME';
  if (status === 'TARGET_REACHED') return 'TARGET_REACHED';
  return elapsed >= target * TIME_THRESHOLDS.approaching ? 'APPROACHING' : null;
}

/** The stage to announce now, or null; each stage is announced at most once. */
export function stageToAnnounce(
  elapsed: number,
  target: number,
  announced: readonly WarningStage[],
): WarningStage | null {
  const stage = currentWarningStage(elapsed, target);
  return stage && !announced.includes(stage) ? stage : null;
}

/** All stages up to and including this one, so earlier stages never fire late. */
export const stagesUpTo = (stage: WarningStage): WarningStage[] =>
  STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(stage) + 1);

/** Timestamps (epoch ms) elapsed time is derived from. */
export interface TimerClock {
  startedAtMs: number;
  /** Set while paused. */
  pausedAtMs: number | null;
  /** Total of earlier completed pauses. */
  pausedTotalMs: number;
}

/** Derived from timestamps, never counted, so backgrounding or slow renders cannot make it drift. */
export function elapsedSecondsAt(clock: TimerClock, nowMs: number): number {
  const effectiveNow = clock.pausedAtMs ?? nowMs;
  return Math.max(0, Math.floor((effectiveNow - clock.startedAtMs - clock.pausedTotalMs) / 1000));
}

/** Total pause time in seconds, including a pause in progress. */
export function pausedSecondsAt(clock: TimerClock, nowMs: number): number {
  const current = clock.pausedAtMs != null ? nowMs - clock.pausedAtMs : 0;
  return Math.max(0, Math.round((clock.pausedTotalMs + current) / 1000));
}

/** mm:ss with unbounded minutes (a 90 minute exam reads 90:00). */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/** Signed mm:ss: "+03:18", "-01:18", "00:00". */
export function formatDifference(differenceSeconds: number): string {
  if (differenceSeconds === 0) return formatClock(0);
  return `${differenceSeconds > 0 ? '+' : '-'}${formatClock(Math.abs(differenceSeconds))}`;
}

/** A persisted timer older than this is treated as abandoned. */
export const MAX_ACTIVE_TIMER_AGE_MS = 6 * 60 * 60 * 1000;

export const isTimerStale = (clock: TimerClock, nowMs: number) =>
  nowMs - clock.startedAtMs > MAX_ACTIVE_TIMER_AGE_MS;

/** "3:18" style gap for sentences ("3:18 länger als empfohlen"). */
export const shortGap = (seconds: number) =>
  formatClock(Math.abs(seconds)).replace(/^0(?=\d:)/, '');
