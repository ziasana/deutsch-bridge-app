"use client";

import { useMemo } from "react";
import { CheckCircle2, Lightbulb, Mail, PenLine } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { ExamPassagePublic } from "@/types/exam";
import { lessonThemeVars } from "../lessonTheme";

/** A writing task split into its parts: lead-in, the message to answer, the instruction, the points to cover and a closing hint. */
interface ParsedTask {
    intro: string[];
    email: string | null;
    instruction: string[];
    points: string[];
    hint: string[];
}

/** Splits the task HTML by its structure (paragraphs, one blockquote, one list). Null when it has no email or points to show. */
export function parseWritingTask(html: string): ParsedTask | null {
    if (typeof DOMParser === "undefined") return null;
    const root = new DOMParser().parseFromString(html, "text/html").body;
    const task: ParsedTask = { intro: [], email: null, instruction: [], points: [], hint: [] };
    for (const el of Array.from(root.children)) {
        if (el.tagName === "BLOCKQUOTE" && !task.email) task.email = el.innerHTML;
        else if ((el.tagName === "UL" || el.tagName === "OL") && task.points.length === 0) task.points = Array.from(el.children).map((li) => li.innerHTML);
        else if (task.points.length > 0) task.hint.push(el.outerHTML);
        else if (task.email) task.instruction.push(el.outerHTML);
        else task.intro.push(el.outerHTML);
    }
    return task.email || task.points.length > 0 ? task : null;
}

const prose = "text-sm leading-relaxed text-foreground/80 [&_em]:not-italic";

/**
 * The prompt of a Schriftlicher Ausdruck task as a visual card: the message to answer shown as an e-mail, the points to
 * cover as numbered cards. Content that does not fit this shape is shown as plain text.
 */
export default function WritingTaskCard({ passages }: Readonly<{ passages: ExamPassagePublic[] }>) {
    // The exercise is fetched in the browser, so DOMParser is available here.
    const tasks = useMemo(() => passages.map((p) => parseWritingTask(p.content ?? "")), [passages]);

    return (
        <article aria-label="Schreibaufgabe" style={lessonThemeVars("writing")} className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
            <header className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <PenLine className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="font-bold leading-tight">Deine Aufgabe</p>
                        <p className="text-xs text-white/85">Lies die Nachricht und schreibe eine passende Antwort.</p>
                    </div>
                </div>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-6">
                {passages.map((p, i) => {
                    const task = tasks[i];
                    if (!task) return p.content ? <LessonMarkdown key={p.id} content={p.content} className="text-sm text-foreground/80" /> : null;
                    return (
                        <div key={p.id} className="space-y-5">
                            {p.imageUrl && <img src={resolveUploadUrl(p.imageUrl) ?? undefined} alt="" className="max-w-full rounded-2xl" />}
                            {task.intro.length > 0 && <LessonMarkdown content={task.intro.join("")} className={prose} />}

                            {task.email && (
                                <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-border/60 bg-accent/50 px-4 py-2.5">
                                        <Mail className="size-4 text-primary" aria-hidden="true" />
                                        <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Nachricht</span>
                                        <span aria-hidden="true" className="ms-auto flex gap-1">
                                            <span className="size-2 rounded-full bg-foreground/15" />
                                            <span className="size-2 rounded-full bg-foreground/15" />
                                            <span className="size-2 rounded-full bg-foreground/15" />
                                        </span>
                                    </div>
                                    <LessonMarkdown content={task.email} className="space-y-1 border-s-4 border-primary/40 px-5 py-4 text-[0.95rem] leading-relaxed text-foreground/85 [&_em]:not-italic [&_p]:my-2" />
                                </div>
                            )}

                            {(task.instruction.length > 0 || task.points.length > 0) && (
                                <section aria-label="Aufgabe">
                                    {task.instruction.length > 0 && <LessonMarkdown content={task.instruction.join("")} className={`${prose} font-semibold text-foreground`} />}
                                    {task.points.length > 0 && (
                                        <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                                            {task.points.map((point, n) => (
                                                <li key={n} className="flex items-start gap-3 rounded-2xl bg-primary/[0.07] p-3.5 ring-1 ring-primary/15">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-sm">{n + 1}</span>
                                                    <LessonMarkdown content={point} className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/85 [&_p]:my-0" />
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary/40" aria-hidden="true" />
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </section>
                            )}

                            {task.hint.length > 0 && (
                                <div className="flex items-start gap-3 rounded-2xl border-s-4 border-amber-400 bg-amber-500/10 p-4">
                                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden="true" />
                                    <LessonMarkdown content={task.hint.join("")} className={`${prose} min-w-0 flex-1`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
