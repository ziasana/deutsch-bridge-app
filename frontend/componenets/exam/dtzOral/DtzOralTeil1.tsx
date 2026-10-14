"use client";

import { DtzOralTeil1 } from "@/types/dtzOral";
import { AllDone, CoverCard, ProgressBar, shell, TaskBadge, emojiFor } from "../speaking/SpeakingStage";
import { PhraseList } from "../speaking/SpeakingContentView";
import { CoverageProps, useCoverage } from "./useCoverage";

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
export default function DtzOralTeil1View({ content, hideHelp = false, covered: coveredProp, onToggle }: Readonly<{ content: DtzOralTeil1; /** Prüfung mode: practice support stays hidden until the attempt is over. */ hideHelp?: boolean } & CoverageProps>) {
    const { covered, toggle } = useCoverage(coveredProp, onToggle);
    const done = content.topics.filter((t) => covered.includes(`topic-${t.number}`)).length;
    const support = new Map(content.practiceSupport.map((entry) => [entry.topicNumber, entry]));
    return (
        <div className="space-y-5">
            <section className={shell} aria-label="Prüfungsaufgabe">
                <div className="bg-gradient-to-br from-pink-500/15 via-orange-400/10 to-amber-400/15 p-5 sm:p-6">
                    <TaskBadge>Teil 1 · Über sich sprechen</TaskBadge>
                    <p className="mt-2 text-lg font-bold text-foreground">{content.instructions}</p>
                    {content.guidance && <p className="mt-1 text-sm text-foreground/70">{content.guidance}</p>}
                    <Explanation explanation={content.explanation} />
                </div>
                <div className="p-5 sm:p-6">
                    <p className="text-xs text-foreground/60">Sprechen Sie über jedes Thema. Tippen Sie ein Thema an, wenn Sie es besprochen haben.</p>
                    <div className="mt-3">
                        <ProgressBar done={done} total={content.topics.length} label="Besprochene Themen" />
                    </div>
                    <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                        {content.topics.map((topic, index) => (
                            <li key={topic.number}>
                                <CoverCard id={`topic-${topic.number}`} index={index} emoji={emojiFor(topic.label)} title={topic.label} covered={covered.includes(`topic-${topic.number}`)} onToggle={toggle} />
                            </li>
                        ))}
                    </ol>
                    {content.topics.length > 0 && done === content.topics.length && <AllDone>Alle Themen besprochen – stark!</AllDone>}
                </div>
            </section>

            {!hideHelp && content.practiceSupport.length > 0 && (
                <section className={`${shell} p-5 sm:p-6`} aria-label="Übungshilfe">
                    <h2 className="text-base font-bold text-foreground">Übungshilfe <span className="font-normal text-foreground/55">(optional)</span></h2>
                    <p className="mt-1 text-sm text-foreground/60">
                        Diese Hilfen gehören nicht zur Prüfungsaufgabe. Die Satzanfänge sind nur Beispiele — sprechen Sie mit Ihren eigenen Informationen.
                    </p>
                    <div className="mt-4 space-y-3">
                        {content.topics.map((topic) => {
                            const entry = support.get(topic.number);
                            if (!entry) return null;
                            return (
                                <details key={topic.number} className="group rounded-2xl border border-border bg-card open:border-pink-500/40 open:bg-pink-500/[0.04]">
                                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-3 text-sm font-semibold text-foreground transition hover:bg-pink-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-400/20 text-lg" aria-hidden="true">{emojiFor(topic.label)}</span>
                                        <span className="min-w-0 flex-1">{topic.label}</span>
                                        <span className="text-xs font-medium text-primary group-open:hidden">Hilfe anzeigen</span>
                                        <span className="hidden text-xs font-medium text-primary group-open:inline">Hilfe ausblenden</span>
                                    </summary>
                                    <div className="space-y-3 px-4 pb-4 text-sm">
                                        {entry.question && <p><span className="font-semibold">Frage: </span>{entry.question}</p>}
                                        {entry.sentenceStarter && (
                                            <p><span className="font-semibold">Satzanfang (Beispiel): </span><span className="italic">{entry.sentenceStarter}</span></p>
                                        )}
                                        {entry.vocabulary.length > 0 && (
                                            <div aria-label="Nützliche Wörter">
                                                <PhraseList phrases={entry.vocabulary} />
                                            </div>
                                        )}
                                        <Explanation explanation={entry.explanation} />
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
