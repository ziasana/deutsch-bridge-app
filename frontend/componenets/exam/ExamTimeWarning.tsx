"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import useExamTimerStore from "@/store/useExamTimerStore";
import { stagesUpTo, stageToAnnounce, WarningStage } from "@/lib/examTime";

const MESSAGES: Partial<Record<WarningStage, { title: string; body: string; tone: string }>> = {
    TARGET_REACHED: {
        title: "Empfohlene Zeit erreicht",
        body: "Du hast die empfohlene Zeit für diesen Teil erreicht. Du kannst weitermachen, versuche aber bald fertig zu werden.",
        tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200",
    },
    OVER_TIME: {
        title: "Du bist über der empfohlenen Zeit",
        body: "Überlege, weiterzugehen, wenn du bei einer Aufgabe unsicher bist.",
        tone: "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200",
    },
};

/**
 * Shows each threshold message once - never repeated on a timer. Which stages were already shown
 * is kept in the persisted timer, so a reload does not bring a dismissed message back. The
 * exercise is never interrupted or stopped.
 */
export default function ExamTimeWarning({
    elapsedSeconds,
    targetSeconds,
    announced,
    dismissed,
}: Readonly<{ elapsedSeconds: number; targetSeconds: number; announced: WarningStage[]; dismissed: WarningStage[] }>) {
    const markAnnounced = useExamTimerStore((s) => s.markAnnounced);
    const dismissWarning = useExamTimerStore((s) => s.dismissWarning);

    useEffect(() => {
        const stage = stageToAnnounce(elapsedSeconds, targetSeconds, announced);
        if (stage) markAnnounced(stagesUpTo(stage));
    }, [elapsedSeconds, targetSeconds, announced, markAnnounced]);

    // The latest announced stage with a message of its own. APPROACHING is only the quiet "noch N Min."
    // line in the bar. Closed messages stay closed, and a newer stage replaces an older one.
    const shown = [...announced].reverse().find((stage) => MESSAGES[stage]) ?? null;
    const message = shown && !dismissed.includes(shown) ? MESSAGES[shown] : null;
    if (!shown || !message) return null;

    return (
        <div role="status" className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${message.tone}`}>
            <div className="flex-1">
                <p className="font-semibold">{message.title}</p>
                <p>{message.body}</p>
            </div>
            <button type="button" aria-label="Hinweis schließen" onClick={() => dismissWarning(shown)} className="shrink-0 opacity-70 hover:opacity-100">
                <X className="size-4" />
            </button>
        </div>
    );
}
