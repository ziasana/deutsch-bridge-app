import { useState } from "react";

/**
 * The "besprochen" ticks of a DTZ task. The practice page owns them (so Prüfung/repeat can reset them and the finish card can count);
 * everywhere else - the admin preview - the view keeps them itself.
 */
export function useCoverage(covered?: string[], onToggle?: (id: string) => void) {
    const [local, setLocal] = useState<string[]>([]);
    if (covered && onToggle) return { covered, toggle: onToggle };
    return { covered: local, toggle: (id: string) => setLocal((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])) };
}

export interface CoverageProps {
    /** Ids of the cards the learner has already talked about (controlled by the practice page). */
    covered?: string[];
    onToggle?: (id: string) => void;
}
