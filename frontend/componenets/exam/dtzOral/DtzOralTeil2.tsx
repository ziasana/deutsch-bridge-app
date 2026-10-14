"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { DtzOralTeil2, PracticeMode } from "@/types/dtzOral";

export const PRACTICE_MODES: { value: PracticeMode; label: string; hint: string }[] = [
    { value: "A2", label: "A2", hint: "Konkrete Fragen zu Ihrem Alltag" },
    { value: "B1", label: "B1", hint: "Gründe, Vergleiche und Meinungen" },
    { value: "MIXED", label: "Gemischt", hint: "A2- und B1-Fragen im Wechsel" },
];

/** The follow-up questions of the chosen practice mode; "MIXED" alternates A2 and B1 and tags every question with its level. */
export function questionsFor(content: DtzOralTeil2, mode: PracticeMode): { text: string; level: "A2" | "B1" }[] {
    const a2 = content.participantB.questionsA2.map((text) => ({ text, level: "A2" as const }));
    const b1 = content.participantB.questionsB1.map((text) => ({ text, level: "B1" as const }));
    if (mode === "A2") return a2;
    if (mode === "B1") return b1;
    const mixed: { text: string; level: "A2" | "B1" }[] = [];
    for (let i = 0; i < Math.max(a2.length, b1.length); i++) {
        if (a2[i]) mixed.push(a2[i]);
        if (b1[i]) mixed.push(b1[i]);
    }
    return mixed;
}

/**
 * Teil 2 - Über Erfahrungen sprechen. The photo stays beside the prompts where the screen is wide enough. Participant A describes the photo,
 * participant B tells about their own experiences; the learner picks A2, B1 or mixed follow-up questions for the same photo.
 * There is no model answer: the task is to speak from the photo and from one's own life.
 */
export default function DtzOralTeil2View({ content, adminImagePrompt }: Readonly<{ content: DtzOralTeil2; adminImagePrompt?: string | null }>) {
    const [mode, setMode] = useState<PracticeMode>("A2");
    const src = resolveUploadUrl(content.image.imageUrl);
    const questions = questionsFor(content, mode);
    const solution = content.possibleSolution;
    const solutionItems = [
        { key: "description", label: "Teilnehmer/in A · Bildbeschreibung", text: solution?.description },
        ...(mode !== "B1" ? [{ key: "experienceA2", label: "Teilnehmer/in B · Erfahrungen (A2)", text: solution?.experienceA2 }] : []),
        ...(mode !== "A2" ? [{ key: "experienceB1", label: "Teilnehmer/in B · Erfahrungen (B1)", text: solution?.experienceB1 }] : []),
    ].filter((item) => item.text);
    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <figure className="rounded-[10px] bg-card p-3 shadow-card lg:sticky lg:top-4 lg:self-start">
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={content.image.altText || "Foto zur Aufgabe"} className="w-full rounded-lg object-cover" />
                ) : (
                    <div role="img" aria-label="Kein Foto" className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/20 text-sm text-foreground/50">
                        <ImageOff className="size-8" aria-hidden="true" />
                        Noch kein Foto
                    </div>
                )}
                {adminImagePrompt && (
                    <figcaption className="mt-3 rounded-lg bg-foreground/[0.04] p-3 text-xs text-foreground/70">
                        <span className="font-semibold">Image prompt (admin only): </span>{adminImagePrompt}
                    </figcaption>
                )}
            </figure>

            <div className="space-y-5">
                <section className="rounded-[10px] bg-card p-6 shadow-card" aria-label="Teilnehmer A">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Teilnehmer/in A · {content.participantA.title}</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{content.participantA.instructions}</p>
                    <ul className="mt-3 space-y-2">
                        {content.participantA.questions.map((q) => (
                            <li key={q} className="rounded-2xl bg-primary/[0.07] p-3 text-sm text-foreground ring-1 ring-primary/15">{q}</li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-[10px] bg-card p-6 shadow-card" aria-label="Teilnehmer B">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Teilnehmer/in B · {content.participantB.title}</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{content.participantB.instructions}</p>
                    <div role="radiogroup" aria-label="Übungsniveau" className="mt-4 inline-flex rounded-lg bg-foreground/[0.06] p-1 text-sm">
                        {PRACTICE_MODES.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                role="radio"
                                aria-checked={mode === m.value}
                                title={m.hint}
                                onClick={() => setMode(m.value)}
                                className={cn("rounded-md px-4 py-1.5 font-semibold transition", mode === m.value ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:text-foreground")}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <ol className="mt-3 space-y-2" aria-label={`Fragen ${mode === "MIXED" ? "gemischt" : mode}`}>
                        {questions.map((q, i) => (
                            <li key={`${q.level}-${q.text}`} className="flex items-start gap-3 rounded-2xl bg-primary/[0.07] p-3 ring-1 ring-primary/15">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">{i + 1}</span>
                                <span className="min-w-0 flex-1 text-sm text-foreground">{q.text}</span>
                                {mode === "MIXED" && <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground/70">{q.level}</span>}
                            </li>
                        ))}
                    </ol>
                </section>

                {solutionItems.length > 0 && (
                    <details className="group rounded-[10px] bg-card shadow-card ring-1 ring-foreground/10 open:ring-primary/30" aria-label="Mögliche Lösung">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-4 text-sm font-semibold text-foreground">
                            Mögliche Lösung
                            <span className="ms-auto text-xs font-medium text-primary group-open:hidden">anzeigen</span>
                            <span className="ms-auto hidden text-xs font-medium text-primary group-open:inline">ausblenden</span>
                        </summary>
                        <div className="space-y-4 px-6 pb-6">
                            <p className="text-xs text-foreground/60">Das ist nur eine mögliche Antwort. Sie können auch ganz anders antworten — sprechen Sie über das, was Sie auf dem Foto sehen und erlebt haben.</p>
                            {solutionItems.map((item) => (
                                <div key={item.key}>
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.label}</p>
                                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}
