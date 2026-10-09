"use client";

import { ReactNode, useId, useState } from "react";
import { ChevronDown, Lightbulb, Star } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { Redemittel } from "@/types/redemittel";
import { cn } from "@/lib/utils";
import { CONTEXT_LABELS, FORMALITY_LABELS, STATUS_LABELS, categoryEmoji } from "./redemittelMeta";

interface Props {
    redemittel: Redemittel;
    /** Called when the learner toggles "Zu meinen Redemitteln"; the toggle is hidden when omitted. */
    onToggleSave?: (redemittel: Redemittel) => void;
    saving?: boolean;
    /** Extra actions (e.g. "Lernen") rendered next to the save toggle at the bottom. */
    children?: ReactNode;
    /** Inside a dialog: no card chrome of its own (the dialog is the card). */
    embedded?: boolean;
}

const sectionTitle = "text-xs font-semibold uppercase tracking-wide text-primary";

function Section({ title, children, className }: Readonly<{ title: string; children: ReactNode; className?: string }>) {
    return (
        <section className={className}>
            <h3 className={sectionTitle}>{title}</h3>
            <div className="mt-1.5 text-sm text-foreground/80">{children}</div>
        </section>
    );
}

/** A section whose content is hidden until the learner asks for it: a quiet row with a chevron. */
function Collapsible({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
    const [open, setOpen] = useState(false);
    const contentId = useId();
    return (
        <section className="rounded-2xl border border-border/60">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <h3 className={sectionTitle}>{title}</h3>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls={contentId}
                    aria-label={`${open ? "Ausblenden" : "Anzeigen"} – ${title}`}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    {open ? "Ausblenden" : "Anzeigen"}
                    <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
                </button>
            </div>
            <div id={contentId} hidden={!open} className="border-t border-border/60 px-4 py-3 text-sm text-foreground/80">
                {open && children}
            </div>
        </section>
    );
}

/**
 * The learning card for one Redemittel. Shared by the learn flow, the detail page and the dialog
 * used from Schreiben and the Redemittel list - and it only renders the sections the admin has actually filled in.
 */
export default function RedemittelDetailCard({ redemittel: r, onToggleSave, saving, children, embedded = false }: Readonly<Props>) {
    const meaning = r.meaning;
    // The German explanation is shown separately only when it adds something beyond the meaning.
    const explanation = r.explanation && r.explanation !== meaning ? r.explanation : null;
    const levelColor = getLevelMeta(r.level).color;
    const chip = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    const hasFooter = Boolean(onToggleSave || children);

    return (
        <article className={cn(!embedded && "overflow-hidden rounded-3xl bg-card shadow-card")}>
            <header className="relative overflow-hidden bg-gradient-to-br from-primary/[0.14] via-primary/[0.05] to-card px-5 pb-6 pt-7 sm:px-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/[0.06]" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-14 right-1/4 size-28 rounded-full bg-primary/[0.04]" />
                <div className="relative flex items-start gap-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-3xl shadow-sm" aria-hidden="true">
                        {categoryEmoji(r.category)}
                    </span>
                    <div className="min-w-0 flex-1 pr-8">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className={chip} style={{ backgroundColor: `${levelColor}1f`, color: levelColor }}>{r.level}</span>
                            <span className={cn(chip, "bg-foreground/[0.06] text-foreground/70")}>{r.categoryLabel}</span>
                            {r.formality && <span className={cn(chip, "bg-foreground/[0.06] text-foreground/70")}>{FORMALITY_LABELS[r.formality]}</span>}
                            <span className={cn(chip, "bg-primary/10 text-primary")}>{STATUS_LABELS[r.status]}</span>
                        </div>
                        <h2 className="mt-3 break-words text-2xl font-bold leading-snug text-foreground sm:text-3xl">{r.phrase}</h2>
                    </div>
                </div>
            </header>

            <div className="space-y-5 px-5 pb-6 pt-5 sm:px-8">
                {meaning && (
                    <Section title="Bedeutung" className="rounded-[10px] border-s-4 border-primary/40 bg-accent/50 px-4 py-3">
                        <p className="text-base font-medium text-foreground">{meaning}</p>
                    </Section>
                )}
                {explanation && <Section title="Erklärung"><LessonMarkdown content={explanation} /></Section>}

                {r.example && (
                    <Section title="Beispiel">
                        <p className="border-s-4 border-primary/25 ps-4 italic leading-relaxed text-foreground/85">„{r.example}“</p>
                    </Section>
                )}

                {r.usageNote && (
                    <Section title="Hinweis" className="rounded-[10px] border-s-4 border-learning-vocabulary bg-learning-vocabulary/10 px-4 py-3">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="mt-0.5 size-4 shrink-0 text-learning-vocabulary" aria-hidden="true" />
                            <div className="min-w-0"><LessonMarkdown content={r.usageNote} /></div>
                        </div>
                    </Section>
                )}
                {r.grammarPattern && (
                    <Section title="Grammatik / Struktur">
                        <p className="rounded-[10px] bg-primary/[0.08] px-4 py-2.5 font-semibold text-foreground">{r.grammarPattern}</p>
                    </Section>
                )}

                {r.contexts.length > 0 && (
                    <Section title="Verwendung">{r.contexts.map((c) => CONTEXT_LABELS[c]).join(" · ")}</Section>
                )}

                {r.similarExpressions.length > 0 && (
                    <Collapsible title="Ähnliche Redemittel">
                        <ul className="list-disc space-y-1 pl-5">
                            {r.similarExpressions.map((s) => (
                                <li key={s}>{s}</li>
                            ))}
                        </ul>
                    </Collapsible>
                )}

                {r.commonMistake && (
                    <Collapsible title="Häufiger Fehler">
                        <p className="whitespace-pre-line rounded-[10px] border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-foreground/85">
                            <span aria-hidden="true">⚠️ </span>
                            {r.commonMistake}
                        </p>
                    </Collapsible>
                )}
            </div>

            {hasFooter && (
                <footer className="flex flex-wrap items-center gap-3 border-t border-border/60 bg-foreground/[0.02] px-5 py-4 sm:px-8">
                    {children}
                    {onToggleSave && (
                        <button
                            type="button"
                            onClick={() => onToggleSave(r)}
                            disabled={saving}
                            aria-pressed={r.saved}
                            className={cn(
                                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50",
                                r.saved ? "border-amber-400/50 bg-amber-400/10 text-foreground" : "border-border bg-card text-foreground hover:bg-accent",
                            )}
                        >
                            <Star className={cn("size-4", r.saved ? "fill-amber-400 text-amber-500" : "text-foreground/60")} aria-hidden="true" />
                            {r.saved ? "In meiner Sammlung" : "Zu meinen Redemitteln"}
                        </button>
                    )}
                </footer>
            )}
        </article>
    );
}
