import { CheckCircle2, Timer, TriangleAlert } from "lucide-react";
import { formatClock } from "@/lib/examTime";
import { ExamPracticeSessionResult } from "@/types/examTime";

const TONES = {
    within: "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    over: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    plain: "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200",
} as const;

/**
 * "Zeit-Check": the learner's time as the headline, with the recommended time and the difference
 * underneath. A soft tinted panel in the same style as the tip boxes, so it sits quietly next to the score.
 */
export default function ExamTimeSummary({
    result,
    className = "",
}: Readonly<{ result: ExamPracticeSessionResult; className?: string }>) {
    const { targetSeconds, differenceSeconds } = result;
    const hasTarget = targetSeconds != null && differenceSeconds != null;
    const tone = !hasTarget ? "plain" : differenceSeconds <= 0 ? "within" : "over";

    let status: React.ReactNode = null;
    if (hasTarget) {
        const gap = formatClock(Math.abs(differenceSeconds)).replace(/^0(?=\d:)/, "");
        status =
            tone === "within" ? (
                <>
                    <CheckCircle2 className="size-4 shrink-0" />
                    {differenceSeconds === 0 ? "Genau in der Vorgabe" : `${gap} unter der Vorgabe`}
                </>
            ) : (
                <>
                    <TriangleAlert className="size-4 shrink-0" />
                    {gap} länger als empfohlen
                </>
            );
    }

    return (
        <div role="status" className={`rounded-lg px-4 py-3 text-sm ${TONES[tone]} ${className}`}>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-70">
                <Timer className="size-3.5" /> Zeit-Check
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatClock(result.elapsedSeconds)}</p>
            {hasTarget && <p className="opacity-80">von {formatClock(targetSeconds)} empfohlen</p>}
            {status && <p className="mt-2 flex items-center gap-1.5 font-medium">{status}</p>}
        </div>
    );
}
