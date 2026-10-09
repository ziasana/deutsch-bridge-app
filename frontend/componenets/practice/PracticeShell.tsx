import { ReactNode } from "react";
import { levelThemeVars } from "@/componenets/learning/levelMeta";

/**
 * Page frame shared by the flashcard-style practice sessions: soft brand atmosphere, one centered column.
 * `accent` (e.g. a word-source colour) re-points the primary colour, so the bar, chips, cards and buttons follow it.
 */
export default function PracticeShell({ children, accent }: Readonly<{ children: ReactNode; accent?: string }>) {
    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" style={accent ? levelThemeVars(accent) : undefined}>
            <div className="mx-auto max-w-xl">{children}</div>
        </div>
    );
}
