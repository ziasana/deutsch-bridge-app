"use client";

import { useState } from "react";
import { Eye, Flag, Timer } from "lucide-react";
import { formatPoints } from "@/lib/examSimulation";
import { cn } from "@/lib/utils";
import type { PartOverview, ProfileOverview, StageOverview } from "@/types/examSimulation";
import { SECTION_STYLE } from "./sectionStyle";

function partsOf(profile: ProfileOverview, stage: StageOverview): PartOverview[] {
    return profile.parts.filter((p) => stage.partKeys.includes(p.key));
}

/**
 * The exam as a journey: a bar whose segments are as wide as the sections are long. Pick a section to see what is in it;
 * the points bar below lights up the parts of that section, and its marker shows where "bestanden" starts.
 */
export default function ExamJourney({ profile }: Readonly<{ profile: ProfileOverview }>) {
    const [selected, setSelected] = useState(0);
    const stage = profile.stages[Math.min(selected, profile.stages.length - 1)];
    const total = profile.stages.reduce((n, s) => n + s.minutes, 0) || 1;
    const stageParts = stage ? partsOf(profile, stage) : [];
    const written = profile.parts.filter((p) => p.module === "WRITTEN" && p.maxPoints > 0);
    const writtenTotal = written.reduce((n, p) => n + p.maxPoints, 0) || 1;
    const pass = (profile.writtenPassThreshold / writtenTotal) * 100;

    const starts = profile.stages.map((_, i) => profile.stages.slice(0, i).reduce((n, st) => n + st.minutes, 0));

    return (
        <section aria-label="Ablauf der Prüfung" className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-lg font-bold text-foreground">So läuft die Prüfung ab</h2>
                    <p className="text-sm text-foreground/60">Tippe auf einen Abschnitt, um zu sehen, was dich erwartet.</p>
                </div>
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70">
                    <Timer className="size-4" aria-hidden /> {profile.totalMinutes} Minuten insgesamt
                </p>
            </div>

            <ol className="mt-5 flex gap-1.5 p-0" aria-label="Abschnitte">
                {profile.stages.map((s, i) => {
                    const sections = Array.from(new Set(partsOf(profile, s).map((p) => p.section)));
                    const lead = sections[0];
                    const style = lead ? SECTION_STYLE[lead] : null;
                    const prep = s.kind === "PREPARATION";
                    const active = i === selected;
                    return (
                        <li key={s.key} className="list-none" style={{ flexGrow: s.minutes, flexBasis: 0, minWidth: "3.25rem" }}>
                            <button
                                type="button"
                                onClick={() => setSelected(i)}
                                aria-pressed={active}
                                aria-label={`${s.label}, ${s.minutes} Minuten`}
                                className={cn(
                                    "group flex h-24 w-full cursor-pointer flex-col justify-between rounded-2xl p-2.5 text-start text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                    prep ? "bg-gradient-to-br from-pink-400 to-amber-400" : (style?.solid ?? "bg-primary"),
                                    active ? "-translate-y-1 shadow-lg ring-2 ring-foreground/70 ring-offset-2 ring-offset-background" : "opacity-70 hover:-translate-y-0.5 hover:opacity-100",
                                )}
                            >
                                <span className="flex items-center gap-1">
                                    {prep ? <Eye className="size-4" aria-hidden /> : sections.map((sec) => {
                                        const Icon = SECTION_STYLE[sec].icon;
                                        return <Icon key={sec} className="size-4" aria-hidden />;
                                    })}
                                </span>
                                <span>
                                    <span className="block truncate text-xs font-bold leading-tight">{s.label}</span>
                                    <span className="text-[11px] font-semibold tabular-nums text-white/85">{s.minutes} Min.</span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
            <div className="mt-1.5 flex justify-between text-[11px] font-medium tabular-nums text-foreground/50" aria-hidden>
                <span>0</span>
                <span>{total} Min.</span>
            </div>

            {stage && (
                <div key={stage.key} className="anim-fade-up mt-4 rounded-2xl bg-accent/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-foreground">
                            {selected + 1}. {stage.label}
                        </p>
                        <p className="text-xs font-semibold tabular-nums text-foreground/60">
                            Minute {starts[selected]}–{starts[selected] + stage.minutes} · {stage.minutes} Min.
                        </p>
                    </div>
                    {stage.kind === "PREPARATION" ? (
                        <p className="mt-2 text-sm text-foreground/70">Vorbereitungszeit: Du siehst die Aufgaben schon jetzt, gesprochen wird danach. Antworten werden erst in der Übungszeit gespeichert.</p>
                    ) : (
                        <ul className="mt-3 grid gap-2 p-0 sm:grid-cols-2">
                            {stageParts.map((p) => {
                                const st = SECTION_STYLE[p.section];
                                const Icon = st.icon;
                                return (
                                    <li key={p.key} className="flex list-none items-center gap-3 rounded-xl bg-card p-3">
                                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-white", st.solid)}>
                                            <Icon className="size-4" aria-hidden />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-foreground">{p.label}</span>
                                            <span className="block text-xs text-foreground/60">
                                                {p.scoringMethod === "PER_QUESTION" ? `${p.questionCount} Fragen` : p.module === "ORAL" ? "Mündliche Übung" : "Freie Aufgabe, wird beurteilt"}
                                            </span>
                                        </span>
                                        <span className="text-xs font-bold tabular-nums text-foreground/80">{p.module === "ORAL" && !profile.oralScoringEnabled ? "Übung" : `${formatPoints(p.maxPoints)} P.`}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            <div className="mt-6">
                <div className="flex items-end justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground">Wo die Punkte liegen</h3>
                    <p className="text-xs text-foreground/60">{formatPoints(profile.writtenMaxPoints)} Punkte schriftlich</p>
                </div>
                <div className="relative mt-6" role="img" aria-label={`Punkteverteilung, bestanden ab ${formatPoints(profile.writtenPassThreshold)} von ${formatPoints(writtenTotal)} Punkten`}>
                    <div className="flex h-8 gap-0.5 overflow-hidden rounded-xl">
                        {written.map((p) => {
                            const inStage = stage?.partKeys.includes(p.key);
                            return (
                                <button
                                    key={p.key}
                                    type="button"
                                    title={`${p.label}: ${formatPoints(p.maxPoints)} Punkte`}
                                    onClick={() => setSelected(Math.max(0, profile.stages.findIndex((s) => s.partKeys.includes(p.key))))}
                                    style={{ flexGrow: p.maxPoints, flexBasis: 0 }}
                                    className={cn("min-w-1 cursor-pointer transition", SECTION_STYLE[p.section].solid, inStage ? "opacity-100" : "opacity-35 hover:opacity-70")}
                                />
                            );
                        })}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 -top-5" style={{ left: `${pass}%` }}>
                        <span className="absolute -top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-green-700 dark:text-green-400">
                            <Flag className="me-0.5 inline size-3" aria-hidden />ab {formatPoints(profile.writtenPassThreshold)}
                        </span>
                        <span className="absolute inset-y-5 w-0.5 -translate-x-1/2 bg-green-600" />
                    </div>
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 p-0">
                    {Array.from(new Set(written.map((p) => p.section))).map((sec) => (
                        <li key={sec} className="flex list-none items-center gap-1.5 text-xs text-foreground/70">
                            <span className={cn("size-2.5 rounded-full", SECTION_STYLE[sec].solid)} />
                            {written.filter((p) => p.section === sec).map((p) => p.label.replace(/\s*Teil\s*\d+$/i, "")).find(Boolean)}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
