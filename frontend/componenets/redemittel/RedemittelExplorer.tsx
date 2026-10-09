"use client";

import { ReactNode } from "react";
import { BookOpen, Compass, Dices, RefreshCw, Sparkles, Star, Trophy, X, type LucideIcon } from "lucide-react";
import { RedemittelStatus } from "@/types/redemittel";
import { LearningSearch } from "@/componenets/learning";
import { cn } from "@/lib/utils";
import { ACCENT_TITLE_COLOR } from "@/componenets/learning/levelMeta";
import RedemittelCategoryPicker from "./RedemittelCategoryPicker";
import RedemittelLevelPills from "./RedemittelLevelPills";

/** The learning journey, in order: new → learning → review → mastered. Colors are the app's learning tokens. */
const STATUS_CHIPS: { status: RedemittelStatus; label: string; icon: LucideIcon; tint: string; text: string; bar: string }[] = [
    { status: "NEW", label: "Neu", icon: Sparkles, tint: "bg-learning-vocabulary/12", text: "text-learning-vocabulary", bar: "bg-learning-vocabulary" },
    { status: "LEARNING", label: "Lernen", icon: BookOpen, tint: "bg-learning-grammar/12", text: "text-learning-grammar", bar: "bg-learning-grammar" },
    { status: "REVIEW", label: "Wiederholen", icon: RefreshCw, tint: "bg-learning-review/12", text: "text-learning-review", bar: "bg-learning-review" },
    { status: "MASTERED", label: "Sicher", icon: Trophy, tint: "bg-learning-reading/12", text: "text-learning-reading", bar: "bg-learning-reading" },
];

export interface ActiveFilter {
    key: string;
    label: string;
    onRemove: () => void;
}

interface Props {
    search: string;
    onSearch: (value: string) => void;
    level: string;
    onLevel: (level: string) => void;
    category: string;
    onCategory: (key: string) => void;
    categories: { key: string; label: string; count: number }[];
    savedOnly: boolean;
    onToggleSaved: () => void;
    savedCount: number | null;
    /** The learning-status filter currently applied (null = none) and the counts shown on its chips; null counts hide the row. */
    status: RedemittelStatus | null;
    onStatus: (status: RedemittelStatus | null) => void;
    statusCounts: { NEW: number; LEARNING: number; REVIEW: number; MASTERED: number } | null;
    /** Opens a random Redemittel; disabled while there is nothing to pick from. */
    onSurprise: () => void;
    canSurprise: boolean;
    /** Filters that can be removed one by one (everything except the plain search box). */
    activeFilters: ActiveFilter[];
    onReset: () => void;
    /** The list of Redemittel, shown inside the same container under the filters. */
    children: ReactNode;
    /** Optional footer (pagination) at the bottom of the container. */
    footer?: ReactNode;
}

/**
 * "Entdecken" as ONE container: a tinted filter header (search + collection switch, level pills,
 * function rail), a strip with removable filter tags (only while a filter is active), then the list itself and a footer.
 * Everything lives on a single surface instead of cards inside cards.
 */
export default function RedemittelExplorer(p: Readonly<Props>) {
    return (
        <div className="rounded-3xl bg-card shadow-card ring-1 ring-border/60">
            <div className="space-y-3 rounded-t-3xl border-b border-border/60 bg-primary/[0.05] p-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Compass className="size-4.5" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-bold" style={{ color: ACCENT_TITLE_COLOR }}>Entdecken</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <LearningSearch compact className="min-w-[200px] flex-1" value={p.search} onChange={p.onSearch} placeholder="Redemittel suchen …" ariaLabel="Redemittel suchen" />
                    <button
                        type="button"
                        aria-pressed={p.savedOnly}
                        onClick={p.onToggleSaved}
                        className={cn(
                            "group inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 cursor-pointer",
                            p.savedOnly
                                ? "border-transparent bg-amber-400 text-amber-950 shadow-sm"
                                : "border-border/60 bg-card text-foreground hover:border-amber-400/60 hover:bg-amber-400/10",
                        )}
                    >
                        <Star className={cn("size-4 transition-transform group-hover:rotate-12", p.savedOnly ? "fill-amber-950" : "text-amber-500")} aria-hidden="true" />
                        Meine Sammlung{p.savedCount !== null ? ` (${p.savedCount})` : ""}
                    </button>
                    <button
                        type="button"
                        onClick={p.onSurprise}
                        disabled={!p.canSurprise}
                        className="group inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                        <Dices className="size-4 transition-transform group-hover:rotate-12" aria-hidden="true" />
                        Überrasch mich
                    </button>
                </div>

                <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2">
                    <RedemittelLevelPills value={p.level} onChange={p.onLevel} />
                    <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
                    <RedemittelCategoryPicker categories={p.categories} value={p.category} onChange={p.onCategory} />
                    {p.statusCounts && (
                        <>
                            <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
                            <div className="flex flex-wrap gap-1" role="group" aria-label="Nach Lernstatus filtern">
                                {STATUS_CHIPS.map((chip) => {
                                    const active = p.status === chip.status;
                                    const Icon = chip.icon;
                                    return (
                                        <button
                                            key={chip.status}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => p.onStatus(active ? null : chip.status)}
                                            className={cn(
                                                "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                                active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-card text-foreground hover:border-primary/40",
                                            )}
                                        >
                                            <Icon className={cn("size-3.5", active ? "text-primary-foreground" : chip.text)} aria-hidden="true" />
                                            <span>{chip.label}</span>
                                            <span className={active ? "text-primary-foreground/80" : "text-foreground/50"}>{p.statusCounts![chip.status]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {p.activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-card px-4 py-2.5 sm:px-6" aria-live="polite">
                    <span className="text-sm font-medium text-foreground/60">Aktive Filter:</span>
                    {p.activeFilters.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={f.onRemove}
                            aria-label={`Filter ${f.label} entfernen`}
                            className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                        >
                            {f.label}
                            <X className="size-3.5" aria-hidden="true" />
                        </button>
                    ))}
                    <button type="button" onClick={p.onReset} className="text-sm font-medium text-foreground/60 underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded cursor-pointer">
                        Alle zurücksetzen
                    </button>
                </div>
            )}

            {p.children}

            {p.footer && <div className="rounded-b-3xl border-t border-border/60 px-4 py-3 sm:px-6">{p.footer}</div>}
        </div>
    );
}
