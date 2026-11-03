import type { AttemptState } from "@/types/examSimulation";

/**
 * Starting an exam already answers with the full state of the new attempt. The page of the running exam would load the same state again a
 * moment later, so the start hands it over here (in memory, for client-side navigation) and the page uses it once if it is still fresh.
 */
const HANDOFF_MAX_AGE_MS = 60_000;
const handoff = new Map<string, { state: AttemptState; at: number }>();

export function stashAttemptState(state: AttemptState) {
    handoff.set(state.attemptId, { state, at: Date.now() });
}

/** The handed-over state of this attempt, once, or null when there is none or it is too old to trust. */
export function takeAttemptState(attemptId: string): AttemptState | null {
    const entry = handoff.get(attemptId);
    handoff.delete(attemptId);
    return entry && Date.now() - entry.at <= HANDOFF_MAX_AGE_MS ? entry.state : null;
}
