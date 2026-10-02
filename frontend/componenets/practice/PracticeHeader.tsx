import Link from "next/link";
import { ReactNode } from "react";
import { X } from "lucide-react";

interface PracticeHeaderProps {
    exitHref: string;
    exitLabel: string;
    counter: string;
    /** 0-100, how far through the whole session the learner is. */
    percent: number;
    /** Optional chips on the right (level, step, word type ...). */
    meta?: ReactNode;
}

/** Top bar of a practice session: exit, "x of y", extra chips and one session-wide progress bar. */
export default function PracticeHeader({ exitHref, exitLabel, counter, percent, meta }: Readonly<PracticeHeaderProps>) {
    return (
        <header>
            <div className="flex items-center gap-3">
                <Link
                    href={exitHref}
                    aria-label={exitLabel}
                    title={exitLabel}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-foreground/60 shadow-sm transition hover:text-foreground hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <X className="size-4" aria-hidden="true" />
                </Link>
                <div
                    role="progressbar"
                    aria-valuenow={Math.round(percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/10"
                >
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(4, percent)}%` }} />
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground/60" aria-live="polite">
                    {counter}
                </span>
            </div>
            {meta && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{meta}</div>}
        </header>
    );
}
