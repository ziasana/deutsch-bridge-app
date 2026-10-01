"use client";

import { ReactNode } from "react";
import { Compass, Star, X } from "lucide-react";
import { LearningSearch } from "@/componenets/learning";
import { cn } from "@/lib/utils";
import RedemittelCategoryPicker from "./RedemittelCategoryPicker";
import RedemittelLevelPills from "./RedemittelLevelPills";

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
        <div>
            <div className="space-y-4 border-b border-border/60 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Compass className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Entdecken</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <LearningSearch className="min-w-[220px] flex-1" value={p.search} onChange={p.onSearch} placeholder="Redemittel suchen …" ariaLabel="Redemittel suchen" />
                    <button
                        type="button"
                        aria-pressed={p.savedOnly}
                        onClick={p.onToggleSaved}
                        className={cn(
                            "group inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 cursor-pointer",
                            p.savedOnly
                                ? "border-transparent bg-amber-400 text-amber-950 shadow-md"
                                : "border-border/60 bg-card text-foreground hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-amber-400/10",
                        )}
                    >
                        <Star className={cn("size-4 transition-transform group-hover:rotate-12 group-hover:scale-110", p.savedOnly ? "fill-amber-950" : "text-amber-500")} aria-hidden="true" />
                        Meine Sammlung{p.savedCount !== null ? ` (${p.savedCount})` : ""}
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Niveau</span>
                    <RedemittelLevelPills value={p.level} onChange={p.onLevel} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Funktion</span>
                    <RedemittelCategoryPicker categories={p.categories} value={p.category} onChange={p.onCategory} />
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
