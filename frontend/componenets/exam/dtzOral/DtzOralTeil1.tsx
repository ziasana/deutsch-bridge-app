"use client";

import { DtzOralTeil1 } from "@/types/dtzOral";

const LANGUAGES: [keyof NonNullable<DtzOralTeil1["explanation"]>, string, "ltr" | "rtl"][] = [["de", "Deutsch", "ltr"], ["en", "English", "ltr"], ["fa", "فارسی", "rtl"]];

function Explanation({ explanation }: Readonly<{ explanation?: NonNullable<DtzOralTeil1["explanation"]> }>) {
    const entries = LANGUAGES.filter(([key]) => explanation?.[key]);
    if (!explanation || entries.length === 0) return null;
    return (
        <dl className="mt-3 space-y-1 rounded-xl bg-foreground/[0.04] p-3 text-sm">
            {entries.map(([key, label, dir]) => (
                <div key={key} className="flex gap-2">
                    <dt className="shrink-0 text-xs font-semibold uppercase text-foreground/50">{label}</dt>
                    <dd dir={dir} lang={key} className="min-w-0 flex-1 text-foreground/80">{explanation[key]}</dd>
                </div>
            ))}
        </dl>
    );
}

/**
 * Teil 1 - Über sich sprechen: the six fixed topics. Practice support (a simple question, a sentence starter, useful vocabulary) is optional,
 * opens per topic and is kept visibly apart from the examination topics: it is help for practising, never a required answer.
 */
export default function DtzOralTeil1View({ content, hideHelp = false }: Readonly<{ content: DtzOralTeil1; /** Prüfung mode: practice support stays hidden until the attempt is over. */ hideHelp?: boolean }>) {
    const support = new Map(content.practiceSupport.map((entry) => [entry.topicNumber, entry]));
    return (
        <div className="space-y-5">
            <section className="rounded-[10px] bg-card p-6 shadow-card sm:p-8" aria-label="Prüfungsaufgabe">
                <p className="text-base font-semibold text-foreground">{content.instructions}</p>
                <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                    {content.topics.map((topic) => (
                        <li key={topic.number} className="flex items-center gap-3 rounded-2xl bg-primary/[0.07] p-4 ring-1 ring-primary/15">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">{topic.number}</span>
                            <span className="text-base font-semibold text-foreground">{topic.label}</span>
                        </li>
                    ))}
                </ol>
                {content.guidance && <p className="mt-4 text-sm text-foreground/70">{content.guidance}</p>}
                <Explanation explanation={content.explanation} />
            </section>

            {!hideHelp && content.practiceSupport.length > 0 && (
                <section className="space-y-3" aria-label="Übungshilfe">
                    <div>
                        <h2 className="text-base font-bold text-foreground">Übungshilfe (optional)</h2>
                        <p className="text-sm text-foreground/60">
                            Diese Hilfen gehören nicht zur Prüfungsaufgabe. Die Satzanfänge sind nur Beispiele — sprechen Sie mit Ihren eigenen Informationen.
                        </p>
                    </div>
                    {content.topics.map((topic) => {
                        const entry = support.get(topic.number);
                        if (!entry) return null;
                        return (
                            <details key={topic.number} className="group rounded-2xl bg-card shadow-card ring-1 ring-foreground/10 open:ring-primary/30">
                                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 text-sm font-semibold text-foreground">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">{topic.number}</span>
                                    {topic.label}
                                    <span className="ms-auto text-xs font-medium text-primary group-open:hidden">Hilfe anzeigen</span>
                                    <span className="ms-auto hidden text-xs font-medium text-primary group-open:inline">Hilfe ausblenden</span>
                                </summary>
                                <div className="space-y-3 px-5 pb-5 text-sm">
                                    {entry.question && <p><span className="font-semibold">Frage: </span>{entry.question}</p>}
                                    {entry.sentenceStarter && (
                                        <p><span className="font-semibold">Satzanfang (Beispiel): </span><span className="italic">{entry.sentenceStarter}</span></p>
                                    )}
                                    {entry.vocabulary.length > 0 && (
                                        <ul className="flex flex-wrap gap-2" aria-label="Nützliche Wörter">
                                            {entry.vocabulary.map((word) => (
                                                <li key={word} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">{word}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <Explanation explanation={entry.explanation} />
                                </div>
                            </details>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
