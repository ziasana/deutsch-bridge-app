import { ExamSection } from "@/types/exam";

export interface TimeThresholds {
    approaching: number;
    target: number;
    overTime: number;
}

/** Where the feedback thresholds live - as fractions of the target. Change them here only. */
export const TIME_THRESHOLDS: TimeThresholds = {
    /** Subtle "x minutes remaining" hint starts here. */
    approaching: 0.8,
    /** The target itself. */
    target: 1,
    /** Beyond this the learner is clearly over the recommended time. */
    overTime: 1.25,
};

/**
 * Sections that get a Teil timer. Hörverstehen is deliberately absent: it is paced by the audio,
 * so a per-Teil countdown would be an artificial limit.
 */
export const TIMED_SECTIONS: readonly ExamSection[] = ["LESEVERSTEHEN", "SPRACHBAUSTEINE", "SCHRIFTLICHER_AUSDRUCK", "MUENDLICHER_AUSDRUCK"];

export type TimeStatus = "ON_TRACK" | "TARGET_REACHED" | "OVER_TIME";

export interface TimeStatusResult {
    status: TimeStatus;
    elapsedSeconds: number;
    targetSeconds: number;
    /** elapsed - target: negative while under target, positive once over. */
    differenceSeconds: number;
}

/**
 * under target -> ON_TRACK; from the target up to and including 125% -> TARGET_REACHED;
 * beyond 125% -> OVER_TIME. (20:00 target: 19:59 on track, 20:00 reached, 25:00 reached, 25:01 over.)
 */
export function getTimeStatus(
    elapsedSeconds: number,
    targetSeconds: number,
    thresholds: TimeThresholds = TIME_THRESHOLDS,
): TimeStatusResult {
    let status: TimeStatus = "ON_TRACK";
    if (elapsedSeconds > targetSeconds * thresholds.overTime) status = "OVER_TIME";
    else if (elapsedSeconds >= targetSeconds * thresholds.target) status = "TARGET_REACHED";
    return { status, elapsedSeconds, targetSeconds, differenceSeconds: elapsedSeconds - targetSeconds };
}

/** The moments worth saying something about, in order. APPROACHING is a quiet hint, not a pop-up. */
export type WarningStage = "APPROACHING" | "TARGET_REACHED" | "OVER_TIME";

const STAGE_ORDER: WarningStage[] = ["APPROACHING", "TARGET_REACHED", "OVER_TIME"];

export function currentWarningStage(elapsedSeconds: number, targetSeconds: number): WarningStage | null {
    const { status } = getTimeStatus(elapsedSeconds, targetSeconds);
    if (status === "OVER_TIME") return "OVER_TIME";
    if (status === "TARGET_REACHED") return "TARGET_REACHED";
    return elapsedSeconds >= targetSeconds * TIME_THRESHOLDS.approaching ? "APPROACHING" : null;
}

/**
 * The stage to announce now, or null. Each stage is announced at most once: if the page was
 * asleep and several stages passed, only the latest one is announced, and earlier ones count as seen.
 */
export function stageToAnnounce(
    elapsedSeconds: number,
    targetSeconds: number,
    announced: readonly WarningStage[],
): WarningStage | null {
    const stage = currentWarningStage(elapsedSeconds, targetSeconds);
    return stage && !announced.includes(stage) ? stage : null;
}

/** All stages up to and including the given one - marking these as announced prevents earlier stages from firing late. */
export function stagesUpTo(stage: WarningStage): WarningStage[] {
    return STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(stage) + 1);
}

/** The pieces of a timer that elapsed time is derived from. All times are epoch milliseconds. */
export interface TimerClock {
    startedAtMs: number;
    /** Set while paused. */
    pausedAtMs: number | null;
    /** Total of all earlier completed pauses. */
    pausedTotalMs: number;
}

/**
 * Elapsed seconds derived from timestamps, never counted: a backgrounded tab, a re-render or a
 * slow request cannot make it drift. While paused, time is frozen at the moment of pausing.
 */
export function elapsedSecondsAt(clock: TimerClock, nowMs: number): number {
    const effectiveNow = clock.pausedAtMs ?? nowMs;
    return Math.max(0, Math.floor((effectiveNow - clock.startedAtMs - clock.pausedTotalMs) / 1000));
}

/** Total pause time so far in seconds (including a pause still in progress) - reported to the server on completion. */
export function pausedSecondsAt(clock: TimerClock, nowMs: number): number {
    const current = clock.pausedAtMs != null ? nowMs - clock.pausedAtMs : 0;
    return Math.max(0, Math.round((clock.pausedTotalMs + current) / 1000));
}

/** mm:ss, with minutes unbounded (a 90 minute exam reads 90:00). */
export function formatClock(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Signed mm:ss for a difference: "+03:18", "-01:18", "00:00". */
export function formatDifference(differenceSeconds: number): string {
    if (differenceSeconds === 0) return formatClock(0);
    return `${differenceSeconds > 0 ? "+" : "-"}${formatClock(Math.abs(differenceSeconds))}`;
}

/** Cumulative minutes after each Teil, in order: [15, 20, 20] -> [15, 35, 55]. */
export function cumulativeTargets(minutesPerTeil: readonly number[]): number[] {
    let running = 0;
    return minutesPerTeil.map((m) => (running += m));
}

/** A persisted timer older than this is treated as abandoned (browser closed and never reopened). */
export const MAX_ACTIVE_TIMER_AGE_MS = 6 * 60 * 60 * 1000;

export function isTimerStale(clock: TimerClock, nowMs: number): boolean {
    return nowMs - clock.startedAtMs > MAX_ACTIVE_TIMER_AGE_MS;
}

export interface ZeitCheckMessage {
    title: string;
    lines: string[];
    /** "within" = at or under the recommended time, "over" = longer than recommended, "plain" = nothing to compare with. */
    tone: "within" | "over" | "plain";
}

/** Wording of the Zeit-Check shown when a run ends: the numbers plus one plain sentence, nothing judgmental. */
export function zeitCheckMessage(result: {
    elapsedSeconds: number;
    targetSeconds: number | null;
    differenceSeconds: number | null;
}): ZeitCheckMessage {
    const time = `Deine Zeit: ${formatClock(result.elapsedSeconds)}`;
    if (result.targetSeconds == null || result.differenceSeconds == null) {
        return { title: "Zeit-Check", lines: [time], tone: "plain" };
    }
    const numbers = `${time} · Empfohlen: ${formatClock(result.targetSeconds)} · Unterschied: ${formatDifference(result.differenceSeconds)}`;
    if (result.differenceSeconds <= 0) {
        return { title: "Zeit-Check", lines: [numbers, "Innerhalb der Vorgabe"], tone: "within" };
    }
    const over = formatClock(result.differenceSeconds).replace(/^0/, "");
    return { title: "Zeit-Check", lines: [numbers, `Du hast ${over} länger gebraucht als empfohlen.`], tone: "over" };
}
