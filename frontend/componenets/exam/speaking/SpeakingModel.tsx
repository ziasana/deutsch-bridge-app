"use client";

import { ReactNode, useState } from "react";
import { Eye, EyeOff, MessageCircle, Mic, UserRound } from "lucide-react";
import { SpeakingContent } from "@/types/exam";
import { cn } from "@/lib/utils";
import { lessonThemeVars } from "../lessonTheme";

/** How the example is shown: read in full, or practise by covering your own lines until you tap them. */
export type Mode = "READ" | "PRACTISE" | "ROLE_A" | "ROLE_B";

const modeButton = "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

export function Segmented({ value, options, onChange }: Readonly<{ value: Mode; options: { value: Mode; label: string }[]; onChange: (mode: Mode) => void }>) {
    return (
        <div role="group" aria-label="Ansicht" className="inline-flex gap-1 rounded-full bg-primary/10 p-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(modeButton, value === o.value ? "bg-primary text-primary-foreground shadow-sm" : "text-primary hover:bg-primary/10")}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** A line of the example that can be covered: while covered the text is not on the page; tapping it reveals the line. */
export function Coverable({ covered, onReveal, children, className }: Readonly<{ covered: boolean; onReveal: () => void; children: ReactNode; className?: string }>) {
    if (!covered) return <>{children}</>;
    return (
        <button
            type="button"
            onClick={onReveal}
            className={cn("flex cursor-pointer items-center gap-2 text-start text-sm font-semibold text-primary/70 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", className)}
        >
            <Eye className="size-4 shrink-0" aria-hidden="true" />
            Antippen zum Aufdecken
        </button>
    );
}

/** Tracks which lines the learner has uncovered; switching the mode covers everything again. */
export function useReveal() {
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    return {
        isRevealed: (id: string) => revealed.has(id),
        reveal: (id: string) => setRevealed((prev) => new Set(prev).add(id)),
        revealAll: (ids: string[]) => setRevealed(new Set(ids)),
        reset: () => setRevealed(new Set()),
    };
}

export function Shell({ label, title, subtitle, controls, children }: Readonly<{ label: string; title: string; subtitle?: string | null; controls?: ReactNode; children: ReactNode }>) {
    return (
        <section aria-label={label} style={lessonThemeVars("speaking")} className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
            <header className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <Mic className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-bold leading-tight">{title}</h2>
                        {subtitle && <p className="truncate text-xs text-white/85">{subtitle}</p>}
                    </div>
                </div>
            </header>
            <div className="space-y-4 p-5 sm:p-6">
                {controls}
                {children}
            </div>
        </section>
    );
}

export const READ_PRACTISE: { value: Mode; label: string }[] = [
    { value: "READ", label: "Lesen" },
    { value: "PRACTISE", label: "Selbst üben" },
];

/** Teil 1: one tab per topic, the example answers as speech bubbles. */
function InterviewModel({ content }: Readonly<{ content: SpeakingContent }>) {
    const topics = content.topics ?? [];
    const [topicId, setTopicId] = useState(topics[0]?.id);
    const [mode, setMode] = useState<Mode>("READ");
    const reveal = useReveal();
    const topic = topics.find((t) => t.id === topicId) ?? topics[0];
    const ids = (topic?.exampleAnswers ?? []).map((_, i) => `${topic?.id}-${i}`);
    const switchMode = (m: Mode) => {
        setMode(m);
        reveal.reset();
    };

    return (
        <Shell
            label="Beispielantworten"
            title="Beispielantworten"
            subtitle="So könnten die Antworten klingen."
            controls={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Segmented value={mode} options={READ_PRACTISE} onChange={switchMode} />
                    {mode === "PRACTISE" && (
                        <button type="button" onClick={() => reveal.revealAll(ids)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            <Eye className="size-3.5" aria-hidden="true" /> Alle aufdecken
                        </button>
                    )}
                </div>
            }
        >
            {content.exampleProfile && (
                <p className="flex items-center gap-2 text-sm font-medium text-foreground/70">
                    <UserRound className="size-4 text-primary" aria-hidden="true" />
                    <span>{content.exampleProfile}</span>
                </p>
            )}
            {topics.length > 1 && (
                <div role="tablist" aria-label="Thema" className="flex flex-wrap gap-2">
                    {topics.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={t.id === topic?.id}
                            onClick={() => setTopicId(t.id)}
                            className={cn(
                                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                t.id === topic?.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/70 hover:bg-accent",
                            )}
                        >
                            {t.title}
                        </button>
                    ))}
                </div>
            )}
            <ol className="space-y-2.5">
                {(topic?.exampleAnswers ?? []).map((answer, i) => {
                    const id = `${topic?.id}-${i}`;
                    return (
                        <li key={id} className="flex items-start gap-3">
                            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">{i + 1}</span>
                            <div className="min-w-0 flex-1 rounded-2xl rounded-ss-md bg-primary/[0.07] px-4 py-3 ring-1 ring-primary/15">
                                <Coverable covered={mode === "PRACTISE" && !reveal.isRevealed(id)} onReveal={() => reveal.reveal(id)}>
                                    <p className="text-sm leading-relaxed text-foreground/85">{answer}</p>
                                </Coverable>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Shell>
    );
}

/** Teil 2: the model answer in paragraphs; can be covered paragraph by paragraph. */
function OpinionModel({ content }: Readonly<{ content: SpeakingContent }>) {
    const [mode, setMode] = useState<Mode>("READ");
    const reveal = useReveal();
    const paragraphs = (content.exampleResponse ?? "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const ids = paragraphs.map((_, i) => String(i));
    const switchMode = (m: Mode) => {
        setMode(m);
        reveal.reset();
    };

    return (
        <Shell
            label="Beispielantwort"
            title="Beispielantwort"
            subtitle="So könnte eine gute Antwort klingen."
            controls={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Segmented value={mode} options={READ_PRACTISE} onChange={switchMode} />
                    {mode === "PRACTISE" && (
                        <button type="button" onClick={() => reveal.revealAll(ids)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            <Eye className="size-3.5" aria-hidden="true" /> Alle aufdecken
                        </button>
                    )}
                </div>
            }
        >
            <div className="space-y-2.5">
                {paragraphs.map((p, i) => (
                    <div key={ids[i]} className="rounded-2xl border-s-4 border-primary bg-primary/[0.05] px-4 py-3">
                        <Coverable covered={mode === "PRACTISE" && !reveal.isRevealed(ids[i])} onReveal={() => reveal.reveal(ids[i])}>
                            <p className="text-sm leading-relaxed text-foreground/85">{p}</p>
                        </Coverable>
                    </div>
                ))}
            </div>
        </Shell>
    );
}

/** Teil 3: the dialogue as a chat. Choose a role to practise it: your lines stay covered until you tap them. */
function DialogueModel({ content }: Readonly<{ content: SpeakingContent }>) {
    const turns = content.exampleDialogue ?? [];
    const [mode, setMode] = useState<Mode>("READ");
    const reveal = useReveal();
    const mine = mode === "ROLE_A" ? "A" : mode === "ROLE_B" ? "B" : null;
    const switchMode = (m: Mode) => {
        setMode(m);
        reveal.reset();
    };

    return (
        <Shell
            label="Beispieldialog"
            title="Beispieldialog"
            subtitle={mine ? `Du sprichst ${mine}. Antworte laut, dann tippe auf deine Zeile.` : "Lies mit oder übe eine Rolle."}
            controls={
                <Segmented
                    value={mode}
                    onChange={switchMode}
                    options={[
                        { value: "READ", label: "Lesen" },
                        { value: "ROLE_A", label: "Ich bin A" },
                        { value: "ROLE_B", label: "Ich bin B" },
                    ]}
                />
            }
        >
            <ol className="space-y-3">
                {turns.map((turn, i) => {
                    const id = String(i);
                    const right = turn.speaker === "B";
                    const covered = turn.speaker === mine && !reveal.isRevealed(id);
                    return (
                        <li key={`${turn.speaker}-${i}`} className={cn("flex items-end gap-2", right && "flex-row-reverse")}>
                            <span
                                aria-hidden="true"
                                className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold", right ? "bg-foreground/10 text-foreground/70" : "bg-primary text-primary-foreground")}
                            >
                                {turn.speaker}
                            </span>
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                    right ? "rounded-ee-md bg-foreground/[0.06] text-foreground/85" : "rounded-es-md bg-primary/[0.09] text-foreground/85 ring-1 ring-primary/15",
                                    turn.speaker === mine && "ring-2 ring-primary/50",
                                )}
                            >
                                <span className="sr-only">{turn.speaker}: </span>
                                <Coverable covered={covered} onReveal={() => reveal.reveal(id)}>
                                    <span>{turn.text}</span>
                                </Coverable>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {mine && (
                <button type="button" onClick={() => reveal.reset()} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <EyeOff className="size-3.5" aria-hidden="true" /> Wieder verdecken
                </button>
            )}
            {turns.length === 0 && <MessageCircle className="size-5 text-foreground/30" aria-hidden="true" />}
        </Shell>
    );
}

/** The exercise's own example answers: bubbles, paragraphs or a chat, readable in full or coverable for self-practice. */
export default function SpeakingModel({ content }: Readonly<{ content: SpeakingContent }>) {
    if (content.taskType === "TOPIC_INTERVIEW") return <InterviewModel key={content.topics?.[0]?.id} content={content} />;
    if (content.taskType === "OPINION_DISCUSSION") return <OpinionModel content={content} />;
    return <DialogueModel content={content} />;
}
