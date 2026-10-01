"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { minutesErrorMessage, TotalCheck } from "@/lib/examTimeSettings";

/** The exam-level duration and the arithmetic that shows whether the Teil times fit inside it. */
export default function ExamDurationSettings({
    total,
    onTotalChange,
    totalError,
    configuredMinutes,
    check,
    maxTotalMinutes,
}: Readonly<{
    total: string;
    onTotalChange: (value: string) => void;
    totalError: boolean;
    configuredMinutes: number;
    check: TotalCheck;
    maxTotalMinutes: number;
}>) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <label htmlFor="exam-total-duration" className="text-sm font-semibold text-foreground">
                        Exam duration
                    </label>
                    <p className="text-xs text-foreground/50">Total time of the timed exam block, including review. Optional.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="exam-total-duration"
                        type="text"
                        inputMode="numeric"
                        value={total}
                        onChange={(e) => onTotalChange(e.target.value)}
                        aria-invalid={totalError}
                        className="w-24 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-red-500"
                    />
                    <span className="text-sm text-foreground/60">minutes</span>
                </div>
            </div>
            {totalError && <p className="text-sm text-red-600 dark:text-red-400">{minutesErrorMessage(1, maxTotalMinutes)}</p>}

            <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <dt className="text-foreground/60">Configured time</dt>
                    <dd className="font-medium text-foreground">{configuredMinutes} min</dd>
                </div>
                {check.kind === "review" && (
                    <div className="flex justify-between">
                        <dt className="text-foreground/60">Recommended review</dt>
                        <dd className="font-medium text-foreground">{check.minutes} min</dd>
                    </div>
                )}
            </dl>

            {check.kind === "review" && (
                <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-4" /> {check.minutes} minutes available for review
                </p>
            )}
            {check.kind === "over" && (
                <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                    <AlertTriangle className="size-4" /> Configuration exceeds exam duration by {check.minutes} minutes.
                </p>
            )}
        </div>
    );
}
