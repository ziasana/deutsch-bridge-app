"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, Search, X } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { DirectoryEntry, DirectorySource, entryMatches, parseDirectorySource } from "@/lib/directorySource";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { badgeClass, choiceClass } from "./LesenTextQuestionsBoard";

/** Label of the optional second passage: the unscored example (see ExamContentMapper.EXAMPLE_LABEL on the backend). */
export const EXAMPLE_LABEL = "Beispiel";

interface Props {
    /** passages[0] is the shared information source; a passage labelled "Beispiel" is the unscored example. */
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** questionId -> the chosen option's text. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
}

const navButton =
    "inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-40";

/** The search text inside a line, marked. */
function Marked({ text, query }: Readonly<{ text: string; query: string }>) {
    const q = query.trim();
    if (!q) return <>{text}</>;
    const parts: React.ReactNode[] = [];
    const lower = text.toLocaleLowerCase("de-DE");
    const needle = q.toLocaleLowerCase("de-DE");
    let from = 0;
    for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
        if (at > from) parts.push(text.slice(from, at));
        parts.push(<mark key={at} className="rounded bg-yellow-300/70 px-0.5 text-inherit">{text.slice(at, at + needle.length)}</mark>);
        from = at + needle.length;
    }
    parts.push(text.slice(from));
    return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

/** One sign of the signboard: the plate (floor / room) on the left, the title and what is offered there on the right. */
function Sign({ entry, query, pinned, dimmed, onTogglePin }: Readonly<{ entry: DirectoryEntry; query: string; pinned: boolean; dimmed: boolean; onTogglePin: () => void }>) {
    return (
        <li
            className={cn(
                "flex overflow-hidden rounded-xl border bg-background shadow-sm transition",
                pinned ? "border-primary ring-2 ring-primary/30" : "border-border/70",
                dimmed && "opacity-35",
            )}
        >
            <div className="flex w-20 shrink-0 items-center justify-center bg-primary/90 px-2 py-3 text-center text-sm font-extrabold leading-tight text-primary-foreground">
                {entry.plate ? <Marked text={entry.plate} query={query} /> : <BookOpen className="size-5" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1 px-4 py-3">
                <p className="text-sm font-bold text-foreground"><Marked text={entry.title} query={query} /></p>
                {entry.details.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-sm text-foreground/75">
                        {entry.details.map((detail, i) => (
                            <li key={i} className="flex gap-2"><span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-foreground/35" /><span><Marked text={detail} query={query} /></span></li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                type="button"
                aria-pressed={pinned}
                aria-label={`Eintrag merken: ${entry.heading}`}
                onClick={onTogglePin}
                className={cn("flex w-10 shrink-0 cursor-pointer items-start justify-center pt-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", pinned ? "text-primary" : "text-foreground/30 hover:text-primary/70")}
            >
                <Bookmark className={cn("size-4", pinned && "fill-current")} aria-hidden="true" />
            </button>
        </li>
    );
}

/** The information source as an interactive signboard: searchable, entries can be pinned. Unstructured sources are shown as text. */
function SourceBoard({ passage, parsed }: Readonly<{ passage: ExamPassagePublic; parsed: DirectorySource | null }>) {
    const [query, setQuery] = useState("");
    const [pinned, setPinned] = useState<Set<string>>(new Set());
    if (!parsed) {
        return (
            <section aria-label={passage.label} className="overflow-hidden rounded-[10px] border border-border/60 bg-card shadow-card">
                <header className="bg-accent/60 px-5 py-3 text-sm font-bold text-foreground">{passage.label}</header>
                <div className="p-5"><LessonMarkdown content={passage.content} className="text-sm leading-relaxed text-foreground/85" /></div>
            </section>
        );
    }
    const hits = parsed.entries.filter((e) => entryMatches(e, query)).length;
    const searching = query.trim() !== "";
    return (
        <section aria-label={passage.label} className="overflow-hidden rounded-[10px] border border-border/60 bg-card shadow-card">
            <header className="bg-gradient-to-br from-slate-800 to-slate-700 px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Wegweiser</p>
                <h3 className="text-lg font-extrabold leading-tight">{passage.label}</h3>
                {parsed.intro.map((line, i) => <p key={i} className="mt-1 text-sm text-white/80">{line}</p>)}
            </header>
            <div className="space-y-3 border-b border-border/60 bg-accent/30 px-4 py-3">
                <label className="relative block">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" aria-hidden="true" />
                    <input
                        type="search"
                        aria-label="Im Wegweiser suchen"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Im Wegweiser suchen …"
                        className="w-full rounded-full border border-border bg-background py-2 ps-9 pe-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                </label>
                <p className="text-xs text-foreground/60" aria-live="polite">
                    {searching ? (hits === 0 ? "Kein Treffer" : `${hits} von ${parsed.entries.length} Einträgen`) : "Tippe das Lesezeichen, um dir wichtige Einträge zu merken."}
                    {pinned.size > 0 && !searching && ` · ${pinned.size} gemerkt`}
                </p>
            </div>
            <ul className="space-y-2.5 p-4">
                {parsed.entries.map((entry) => (
                    <Sign
                        key={entry.id}
                        entry={entry}
                        query={query}
                        pinned={pinned.has(entry.id)}
                        dimmed={searching && !entryMatches(entry, query)}
                        onTogglePin={() => setPinned((prev) => { const next = new Set(prev); if (!next.delete(entry.id)) next.add(entry.id); return next; })}
                    />
                ))}
            </ul>
        </section>
    );
}

/**
 * DTZ Lesen Teil 1 (Kataloge, Register, Verzeichnisse verstehen): the information source drawn as a signboard (search, pin entries) next to
 * the five situations, one at a time, with a progress bar and numbered step buttons. On wide screens the signboard stays next to the
 * situation; on small screens it opens in a panel on top of it.
 */
export default function LesenDirectoryBoard({ passages, questions, answers, disabled, onAnswer }: Readonly<Props>) {
    const [sourceOpen, setSourceOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(questions[0]?.id ?? null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const source = passages[0];
    const parsed = parseDirectorySource(source?.content);
    const example = passages.find((p, i) => i > 0 && p.label === EXAMPLE_LABEL);
    const active = questions.find((q) => q.id === activeId) ?? questions[0];
    const activeIndex = active ? questions.indexOf(active) : -1;
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const allDone = questions.length > 0 && answeredCount === questions.length;
    const numberOf = (q: ExamQuestionPublic) => q.questionNumber ?? questions.indexOf(q) + 1;

    // The exam's side navigation asks for a question by id.
    useEffect(() => {
        const onGoto = (e: Event) => {
            const id = (e as CustomEvent<string>).detail;
            if (questions.some((q) => q.id === id)) setActiveId(id);
        };
        window.addEventListener("exam:goto", onGoto);
        return () => window.removeEventListener("exam:goto", onGoto);
    }, [questions]);

    useEffect(() => {
        if (!sourceOpen) return;
        closeButton.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSourceOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [sourceOpen]);

    if (!source || !active) return null;

    const choose = (option: string) => {
        const firstAnswer = !answers[active.id];
        onAnswer(active.id, option);
        // a first answer moves on to the next open situation
        if (firstAnswer) {
            const next = questions.find((q) => q.id !== active.id && !answers[q.id] && questions.indexOf(q) > activeIndex) ?? questions.find((q) => q.id !== active.id && !answers[q.id]);
            if (next) setActiveId(next.id);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                <SourceBoard passage={source} parsed={parsed} />
            </div>

            <div className="space-y-4">
                <div className="rounded-[10px] border border-border/60 bg-card p-4 shadow-card">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">Aufgabe {numberOf(active)} · {activeIndex + 1} von {questions.length}</p>
                        <p className="text-xs text-foreground/55">{answeredCount}/{questions.length} beantwortet</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-accent" role="progressbar" aria-label="Fortschritt" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
                        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {questions.map((q) => {
                            const done = !!answers[q.id];
                            const current = q.id === active.id;
                            return (
                                <button
                                    key={q.id}
                                    type="button"
                                    aria-label={`Aufgabe ${numberOf(q)}, ${done ? "beantwortet" : "noch offen"}`}
                                    aria-current={current ? "step" : undefined}
                                    onClick={() => setActiveId(q.id)}
                                    className={cn(
                                        "flex size-9 cursor-pointer items-center justify-center rounded-full border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                        done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground/70 hover:border-primary/60",
                                        current && "scale-110 ring-2 ring-primary/40 ring-offset-2 ring-offset-card",
                                    )}
                                >
                                    {done && !current ? <Check className="size-4" aria-hidden="true" /> : numberOf(q)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {example && (
                    <section aria-label={EXAMPLE_LABEL} className="rounded-[10px] border border-dashed border-border bg-background p-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground/55">{EXAMPLE_LABEL}</p>
                        <LessonMarkdown content={example.content} className="text-sm text-foreground/85" />
                    </section>
                )}

                <fieldset key={active.id} disabled={disabled} className="anim-slide-in space-y-2.5 rounded-[10px] border border-border/60 bg-card p-5 shadow-card">
                    <legend className="sr-only">Aufgabe {numberOf(active)}</legend>
                    <p className="mb-2 flex gap-3 text-base font-semibold leading-snug text-foreground">
                        <span className="shrink-0 text-primary">{numberOf(active)}</span>
                        <span className="min-w-0 break-words">{active.prompt}</span>
                    </p>
                    {(active.options ?? []).map((option, i) => (
                        <button key={option} type="button" aria-pressed={answers[active.id] === option} onClick={() => choose(option)} className={choiceClass(answers[active.id] === option)}>
                            <span aria-hidden="true" className={badgeClass(answers[active.id] === option)}>{String.fromCharCode(97 + i)}</span>
                            <span className="min-w-0 flex-1 break-words">{option}</span>
                        </button>
                    ))}
                    <div className="flex items-center justify-between gap-2 pt-2">
                        <button type="button" className={navButton} disabled={activeIndex <= 0} onClick={() => setActiveId(questions[activeIndex - 1].id)}>
                            <ArrowLeft className="size-3.5" aria-hidden="true" /> Zurück
                        </button>
                        <button type="button" className={navButton} disabled={activeIndex >= questions.length - 1} onClick={() => setActiveId(questions[activeIndex + 1].id)}>
                            Weiter <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                    </div>
                </fieldset>

                {allDone && (
                    <p className="anim-pop rounded-2xl bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) p-4 text-sm font-semibold text-white shadow-md">
                        Alle Aufgaben sind beantwortet. Du kannst deine Antworten noch ändern oder jetzt abgeben.
                    </p>
                )}
            </div>

            <button
                type="button"
                onClick={() => setSourceOpen(true)}
                className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg lg:hidden"
            >
                <BookOpen className="size-4" aria-hidden="true" />
                {source.label}
            </button>

            {sourceOpen && (
                <div className="fixed inset-0 z-40 flex flex-col bg-background lg:hidden" role="dialog" aria-modal="true" aria-label={source.label}>
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <h2 className="text-base font-bold text-foreground">{source.label}</h2>
                        <button ref={closeButton} type="button" onClick={() => setSourceOpen(false)} aria-label="Schließen" className="rounded-full p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <SourceBoard passage={source} parsed={parsed} />
                    </div>
                </div>
            )}
        </div>
    );
}
