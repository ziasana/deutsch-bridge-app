"use client";

import { ReactNode, useId, useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/componenets/ui/badge";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { Redemittel } from "@/types/redemittel";
import { CONTEXT_LABELS, FORMALITY_LABELS, STATUS_LABELS } from "./redemittelMeta";

interface Props {
    redemittel: Redemittel;
    /** Called when the learner toggles "Zu meinen Redemitteln"; the toggle is hidden when omitted. */
    onToggleSave?: (redemittel: Redemittel) => void;
    saving?: boolean;
    /** Extra actions (e.g. "Lernen") rendered under the card content. */
    children?: ReactNode;
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
    return (
        <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</h3>
            <div className="mt-0.5 text-sm text-foreground/80">{children}</div>
        </section>
    );
}

/** A section whose content is hidden until the learner asks for it. */
function Collapsible({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
    const [open, setOpen] = useState(false);
    const contentId = useId();
    return (
        <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</h3>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={contentId}
                aria-label={`${open ? "Ausblenden" : "Anzeigen"} – ${title}`}
                className="mt-0.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded cursor-pointer"
            >
                {open ? "Ausblenden" : "Anzeigen"}
            </button>
            <div id={contentId} hidden={!open} className="mt-1 text-sm text-foreground/80">
                {open && children}
            </div>
        </section>
    );
}

/**
 * The learning card for one Redemittel. Shared by the learn flow, the detail page and the dialog
 * used from Schreiben - and it only renders the sections the admin has actually filled in.
 */
export default function RedemittelDetailCard({ redemittel: r, onToggleSave, saving, children }: Readonly<Props>) {
    const meaning = r.meaning;
    // The German explanation is shown separately only when it adds something beyond the meaning.
    const explanation = r.explanation && r.explanation !== meaning ? r.explanation : null;

    return (
        <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{r.level}</Badge>
                    <Badge variant="outline">{r.categoryLabel}</Badge>
                    {r.formality && <Badge variant="outline">{FORMALITY_LABELS[r.formality]}</Badge>}
                    <Badge variant="outline">{STATUS_LABELS[r.status]}</Badge>
                </div>
                {onToggleSave && (
                    <button
                        type="button"
                        onClick={() => onToggleSave(r)}
                        disabled={saving}
                        aria-pressed={r.saved}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 cursor-pointer"
                    >
                        <Star className={`size-4 ${r.saved ? "fill-amber-400 text-amber-500" : "text-foreground/60"}`} aria-hidden="true" />
                        {r.saved ? "In meiner Sammlung" : "Zu meinen Redemitteln"}
                    </button>
                )}
            </div>

            <h2 className="mt-4 break-words text-2xl font-bold leading-snug text-foreground sm:text-3xl">{r.phrase}</h2>

            <div className="mt-4 space-y-3">
                {meaning && <Section title="Bedeutung">{meaning}</Section>}
                {explanation && <Section title="Erklärung"><LessonMarkdown content={explanation} /></Section>}

                {r.example && (
                    <Section title="Beispiel">
                        <p className="rounded-lg bg-accent/50 px-3 py-2.5 italic text-foreground/85">„{r.example}“</p>
                    </Section>
                )}

                {r.usageNote && <Section title="Hinweis"><LessonMarkdown content={r.usageNote} /></Section>}
                {r.grammarPattern && (
                    <Section title="Grammatik / Struktur">
                        <p className="rounded-lg bg-primary/10 px-3 py-2.5 font-medium text-foreground">{r.grammarPattern}</p>
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
                        <p className="whitespace-pre-line rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-foreground/85">
                            <span aria-hidden="true">⚠️ </span>
                            {r.commonMistake}
                        </p>
                    </Collapsible>
                )}
            </div>

            {children && <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">{children}</div>}
        </article>
    );
}
