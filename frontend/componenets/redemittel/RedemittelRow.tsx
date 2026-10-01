"use client";

import { Check, ChevronRight, Star } from "lucide-react";
import { Redemittel } from "@/types/redemittel";
import { cn } from "@/lib/utils";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { STATUS_LABELS, STATUS_STEP, categoryEmoji } from "./redemittelMeta";

interface Props {
    redemittel: Redemittel;
    onOpen: (redemittel: Redemittel) => void;
    onToggleSave: (redemittel: Redemittel) => void;
    /** Position in the list, used to stagger the entrance animation. */
    index?: number;
}

const STEPS = 3;

/** Progress as small segments (new → learning → review → mastered) plus the status in words, so it is never color alone. */
function StatusStepper({ status, color }: Readonly<{ status: Redemittel["status"]; color: string }>) {
    const step = STATUS_STEP[status];
    return (
        <div className="flex items-center gap-2" role="img" aria-label={`Status: ${STATUS_LABELS[status]}`}>
            <div className="flex gap-1" aria-hidden="true">
                {Array.from({ length: STEPS }).map((_, i) => (
                    <span key={i} className="h-1.5 w-5 rounded-full bg-foreground/10 transition-colors" style={i < step ? { backgroundColor: color } : undefined} />
                ))}
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-foreground/60">
                {status === "MASTERED" && <Check className="size-3.5 text-learning-reading" aria-hidden="true" />}
                {STATUS_LABELS[status]}
            </span>
        </div>
    );
}

/**
 * One Redemittel as a row of the list: no box of its own, just a hairline separator, so the whole
 * list reads as one calm surface. Hovering lifts a soft highlight and nudges the chevron.
 */
export default function RedemittelRow({ redemittel: r, onOpen, onToggleSave, index = 0 }: Readonly<Props>) {
    const color = getLevelMeta(r.level).color;

    return (
        <li
            className="anim-fade-up group relative flex items-center transition-colors hover:bg-accent/50"
            style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
        >
            <span className="absolute inset-y-2 left-0 w-1 rounded-r-full opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: color }} aria-hidden="true" />
            <button
                type="button"
                onClick={() => onOpen(r)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 sm:gap-4 sm:px-5 cursor-pointer"
            >
                <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
                    style={{ backgroundColor: `${color}1f` }}
                    aria-hidden="true"
                >
                    {categoryEmoji(r.category)}
                </span>

                <span className="min-w-0 flex-1">
                    <h3 className="break-words text-base font-bold leading-snug text-foreground">{r.phrase}</h3>
                    <span className="mt-0.5 block truncate text-sm text-foreground/60">
                        {r.meaning ?? r.categoryLabel}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs font-medium text-foreground/50">{r.categoryLabel}</span>
                        <StatusStepper status={r.status} color={color} />
                    </span>
                </span>

                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}1f`, color }}>
                    {r.level}
                </span>
            </button>

            <button
                type="button"
                onClick={() => onToggleSave(r)}
                aria-pressed={r.saved}
                aria-label={r.saved ? "Aus meiner Sammlung entfernen" : "Zu meinen Redemitteln hinzufügen"}
                className="mr-1 flex size-10 shrink-0 items-center justify-center rounded-full text-foreground/40 transition hover:scale-110 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-90 cursor-pointer"
            >
                <Star className={cn("size-5 transition-colors", r.saved && "fill-amber-400 text-amber-500")} aria-hidden="true" />
            </button>
            <ChevronRight className="mr-3 hidden size-4 shrink-0 text-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/60 sm:mr-4 md:block" aria-hidden="true" />
        </li>
    );
}
