"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";

/**
 * The learner-facing task of Mündlicher Ausdruck as an interactive "stage". Where {@link SpeakingStimulus} is the plain, read-only
 * task (used by the admin preview), the stage lets the learner tap every topic / task / planning point once it has been talked about,
 * so the conversation has a visible progress. Which ids are covered is owned by the parent (it is reset when the exercise is repeated).
 */

interface SpeakingStageProps {
    content: SpeakingContent;
    guide?: SpeakingGuideContent | null;
    /** Ids of the topics / goals / planning points the learner has already talked about. */
    covered: string[];
    onToggle: (id: string) => void;
}

const heading = "text-sm font-semibold text-foreground";
const shell = "overflow-hidden rounded-2xl bg-card shadow-card";

/** Soft accent per card, cycled so neighbouring cards look different. */
const ACCENTS = [
    "from-pink-500/15 to-pink-500/5 border-pink-500/30",
    "from-amber-500/15 to-amber-500/5 border-amber-500/30",
    "from-sky-500/15 to-sky-500/5 border-sky-500/30",
    "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30",
    "from-violet-500/15 to-violet-500/5 border-violet-500/30",
    "from-orange-500/15 to-orange-500/5 border-orange-500/30",
];

const EMOJI_RULES: [RegExp, string][] = [
    [/wann|zeit|termin|datum/i, "🗓️"],
    [/wo\b|ort|treffpunkt|raum/i, "📍"],
    [/essen|speise|kuchen|kochen|buffet/i, "🍽️"],
    [/getränk|trinken|saft/i, "🥤"],
    [/bezahl|geld|kosten|budget|preis/i, "💶"],
    [/einlad|gäste|wer kommt/i, "💌"],
    [/musik|programm|spiel|tanz/i, "🎶"],
    [/aufräum|putzen|sauber/i, "🧹"],
    [/geschenk/i, "🎁"],
    [/transport|anreise|auto|bahn|bus/i, "🚌"],
    [/name|vorstell/i, "👋"],
    [/familie|kinder/i, "👨‍👩‍👧"],
    [/beruf|arbeit|ausbildung|schule|studium/i, "💼"],
    [/hobby|freizeit|sport/i, "🎨"],
    [/wohn|stadt|heimat|land/i, "🏠"],
    [/sprache|deutsch/i, "🗣️"],
    [/reise|urlaub|ferien/i, "✈️"],
];

export const emojiFor = (title: string, fallback = "💬"): string => EMOJI_RULES.find(([rule]) => rule.test(title))?.[1] ?? fallback;

/** Emoji of the whole scene, used by the illustration that stands in for a missing picture. */
const SCENE_RULES: [RegExp, string][] = [
    [/party|feier|fest|geburtstag|abschied/i, "🎉"],
    [/ausflug|reise|wander|fahrt|urlaub/i, "🧭"],
    [/geschenk/i, "🎁"],
    [/essen|kochen|grill|picknick/i, "🍽️"],
    [/sport|turnier|spiel/i, "⚽"],
    [/film|kino|konzert|theater/i, "🎬"],
];
const sceneEmoji = (topic: string | null | undefined) => SCENE_RULES.find(([rule]) => rule.test(topic ?? ""))?.[1] ?? "🗓️";

/** How many topics / tasks / planning points the stage offers to tick off. */
export function stageTotal(content: SpeakingContent, guide?: SpeakingGuideContent | null): number {
    if (content.taskType === "TOPIC_INTERVIEW") return content.topics?.length ?? 0;
    if (content.taskType === "OPINION_DISCUSSION") return guide?.goals?.length ?? 0;
    return content.planningPoints?.length ?? 0;
}

function ProgressBar({ done, total, label }: Readonly<{ done: number; total: number; label: string }>) {
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return (
        <div className="flex items-center gap-3" role="group" aria-label={label}>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-accent" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label}>
                <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground/70">
                {done}/{total}
            </span>
        </div>
    );
}

/** A tappable card: marks one topic / task / point as "talked about". */
function CoverCard({
    id,
    index,
    emoji,
    title,
    hint,
    covered,
    onToggle,
}: Readonly<{ id: string; index: number; emoji: string; title: string; hint?: string | null; covered: boolean; onToggle: (id: string) => void }>) {
    return (
        <button
            type="button"
            aria-pressed={covered}
            onClick={() => onToggle(id)}
            style={{ animationDelay: `${index * 45}ms` }}
            className={cn(
                "anim-fade-up group relative flex min-h-[4.5rem] w-full cursor-pointer items-center gap-3 rounded-2xl border bg-gradient-to-br p-3 text-start transition",
                "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-0",
                covered ? "border-emerald-500/50 from-emerald-500/20 to-emerald-500/5" : ACCENTS[index % ACCENTS.length],
            )}
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-2xl shadow-sm transition group-hover:scale-110" aria-hidden="true">
                {emoji}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                {hint && <span className="block text-xs text-foreground/60">{hint}</span>}
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                    covered ? "anim-pop border-emerald-500 bg-emerald-500 text-white" : "border-foreground/20 text-transparent",
                )}
            >
                <Check className="size-3.5" />
            </span>
            <span className="sr-only">{covered ? "besprochen" : "noch nicht besprochen"}</span>
        </button>
    );
}

/** Teil 3 scene picture: fills its frame, opens enlarged on click, and falls back to an illustration when the exercise has none. */
function SceneImage({ src, alt, topic }: Readonly<{ src: string | null; alt: string; topic: string | null | undefined }>) {
    const [open, setOpen] = useState(false);
    const [failed, setFailed] = useState(false);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    if (!src || failed) {
        return (
            <div
                aria-hidden="true"
                className="relative flex h-full min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-pink-500/25 via-orange-400/20 to-amber-400/25"
            >
                <span className="absolute -start-6 -top-6 size-28 rounded-full bg-pink-500/20" />
                <span className="absolute -bottom-8 -end-4 size-32 rounded-full bg-amber-400/25" />
                <span className="relative text-7xl drop-shadow-sm animate-float">{sceneEmoji(topic)}</span>
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Bild vergrößern"
                aria-haspopup="dialog"
                className="group relative block h-full min-h-48 w-full cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <img src={src} alt={alt} onError={() => setFailed(true)} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute bottom-2 end-2 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition group-hover:bg-black/75" aria-hidden="true">
                    <Maximize2 className="size-4" />
                </span>
            </button>
            {open && (
                <div role="dialog" aria-modal="true" aria-label="Bild vergrößert" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
                    <button
                        ref={closeRef}
                        type="button"
                        aria-label="Bild schließen"
                        onClick={() => setOpen(false)}
                        className="absolute end-4 top-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <X className="size-5" />
                    </button>
                    <img src={src} alt={alt} className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </>
    );
}

function TaskBadge({ children }: Readonly<{ children: React.ReactNode }>) {
    return <span className="inline-flex rounded-full bg-pink-500/15 px-2.5 py-0.5 text-xs font-bold text-pink-700 dark:text-pink-300">{children}</span>;
}

function AllDone({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <p role="status" className="anim-pop mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            🎉 {children}
        </p>
    );
}

function Teil1Stage({ content, covered, onToggle }: Readonly<Omit<SpeakingStageProps, "guide">>) {
    const topics = content.topics ?? [];
    const done = topics.filter((t) => covered.includes(t.id)).length;
    return (
        <section className={`${shell} p-5 sm:p-6`} aria-label="Aufgabe">
            <TaskBadge>Teil 1 · Einander kennenlernen</TaskBadge>
            <h2 className="mt-2 text-lg font-bold text-foreground">Stellen Sie sich vor</h2>
            <p className="mt-1 text-sm text-foreground/70">Sprechen Sie über jedes Thema – und stellen Sie Ihrem Partner auch Fragen. Tippen Sie ein Thema an, wenn Sie es besprochen haben.</p>
            <div className="mt-4">
                <ProgressBar done={done} total={topics.length} label="Besprochene Themen" />
            </div>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {topics.map((topic, index) => (
                    <li key={topic.id}>
                        <CoverCard id={topic.id} index={index} emoji={emojiFor(`${topic.id} ${topic.title}`)} title={topic.title} covered={covered.includes(topic.id)} onToggle={onToggle} />
                    </li>
                ))}
            </ul>
            {topics.length > 0 && done === topics.length && <AllDone>Alle Themen besprochen – stark!</AllDone>}
        </section>
    );
}

function Teil2Stage({ content, guide, covered, onToggle }: Readonly<SpeakingStageProps>) {
    const person = content.person;
    const image = resolveUploadUrl(person?.image ?? null);
    const goals = guide?.goals ?? [];
    const done = goals.filter((g) => covered.includes(g.id)).length;
    const initials = (person?.name ?? "?")
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (
        <section className={shell} aria-label="Aufgabe">
            <div className="bg-gradient-to-br from-pink-500/15 via-orange-400/10 to-amber-400/15 p-5 sm:p-6">
                <TaskBadge>Teil 2 · Über ein Thema sprechen</TaskBadge>
                <h2 className="mt-2 text-lg font-bold text-foreground">{content.topic}</h2>
                <div className="mt-4 flex items-start gap-4">
                    {image ? (
                        <img src={image} alt={person?.imageAlt ?? ""} className="size-20 shrink-0 rounded-full border-4 border-card object-cover shadow-md sm:size-24" />
                    ) : (
                        <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-pink-500 to-orange-400 text-2xl font-bold text-white shadow-md sm:size-24">
                            {initials}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        {person && (
                            <p className="text-sm font-semibold text-foreground">
                                {person.name}, {person.age} Jahre, {person.occupation}
                            </p>
                        )}
                        <blockquote className="relative mt-2 whitespace-pre-line rounded-2xl rounded-ss-sm bg-card p-4 text-sm leading-relaxed text-foreground/90 shadow-sm">
                            {content.opinionText}
                        </blockquote>
                    </div>
                </div>
            </div>
            {goals.length > 0 && (
                <div className="p-5 sm:p-6">
                    <h3 className={heading}>Ihre Aufgaben</h3>
                    <p className="mt-1 text-xs text-foreground/60">Arbeiten Sie die Aufgaben der Reihe nach ab und tippen Sie sie an, wenn sie erledigt sind.</p>
                    <div className="mt-3">
                        <ProgressBar done={done} total={goals.length} label="Erledigte Aufgaben" />
                    </div>
                    <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                        {goals.map((goal, index) => (
                            <li key={goal.id}>
                                <CoverCard id={goal.id} index={index} emoji={`${index + 1}`} title={goal.description} covered={covered.includes(goal.id)} onToggle={onToggle} />
                            </li>
                        ))}
                    </ol>
                    {done === goals.length && <AllDone>Alle Aufgaben erledigt!</AllDone>}
                </div>
            )}
        </section>
    );
}

function Teil3Stage({ content, covered, onToggle }: Readonly<Omit<SpeakingStageProps, "guide">>) {
    const points = content.planningPoints ?? [];
    const done = points.filter((p) => covered.includes(p.id)).length;
    const image = resolveUploadUrl(content.image ?? null);
    return (
        <section className={shell} aria-label="Aufgabe">
            {/* The scene picture sits beside the scenario (on top of it on phones), so the situation is seen before it is read. */}
            <div className="grid md:grid-cols-5">
                <div className="aspect-[4/3] md:col-span-2 md:aspect-auto">
                    <SceneImage src={image} alt={content.imageAlt ?? content.topic ?? ""} topic={content.topic} />
                </div>
                <div className="p-5 sm:p-6 md:col-span-3">
                    <TaskBadge>Teil 3 · Gemeinsam etwas planen</TaskBadge>
                    <h2 className="mt-2 text-lg font-bold text-foreground">{content.topic}</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{content.scenario}</p>
                </div>
            </div>
            <div className="border-t border-border/60 p-5 sm:p-6">
                <h3 className={heading}>Besprechen Sie:</h3>
                <p className="mt-1 text-xs text-foreground/60">Machen Sie Vorschläge, reagieren Sie auf Ihren Partner und einigen Sie sich. Tippen Sie jeden Punkt an, den Sie geklärt haben.</p>
                <div className="mt-3">
                    <ProgressBar done={done} total={points.length} label="Geklärte Planungspunkte" />
                </div>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {points.map((point, index) => (
                        <li key={point.id}>
                            <CoverCard id={point.id} index={index} emoji={emojiFor(point.title, "📌")} title={point.title} hint={point.hint} covered={covered.includes(point.id)} onToggle={onToggle} />
                        </li>
                    ))}
                </ul>
                {points.length > 0 && done === points.length && <AllDone>Alles geplant – jetzt noch auf eine gemeinsame Lösung einigen!</AllDone>}
            </div>
        </section>
    );
}

export default function SpeakingStage(props: Readonly<SpeakingStageProps>) {
    if (props.content.taskType === "TOPIC_INTERVIEW") return <Teil1Stage {...props} />;
    if (props.content.taskType === "OPINION_DISCUSSION") return <Teil2Stage {...props} />;
    return <Teil3Stage {...props} />;
}
