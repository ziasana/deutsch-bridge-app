"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flag, Loader2, Target } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getPublicMockExams } from "@/services/examSimulationService";
import type { PublicMockProfile } from "@/types/examSimulation";
import { skillMeta } from "./skillMeta";
import { useMarketing } from "./useMarketing";

const SKILL_BY_SECTION: Record<string, string> = {
    LESEVERSTEHEN: "lesen",
    SPRACHBAUSTEINE: "sprachbausteine",
    HOERVERSTEHEN: "hoeren",
    SCHRIFTLICHER_AUSDRUCK: "schreiben",
    MUENDLICHER_AUSDRUCK: "sprechen",
};

const SKILL_LABEL: Record<string, string> = {
    lesen: "Lesen",
    sprachbausteine: "Sprachbausteine",
    hoeren: "Hören",
    schreiben: "Schreiben",
    sprechen: "Sprechen",
};

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** "TELC" is shown as the brand writes it; other providers are shown as stored. */
const providerLabel = (provider: string) => (provider.toUpperCase() === "TELC" ? "telc" : provider);

const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

function Chip({ active, onClick, children }: Readonly<{ active: boolean; onClick: () => void; children: React.ReactNode }>) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"
            }`}
        >
            {children}
        </button>
    );
}

function MockExamCard({ exam }: Readonly<{ exam: PublicMockProfile }>) {
    const { m } = useMarketing();
    const f = m.mockTest.finder;
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const skills = [...new Set(exam.parts.map((part) => SKILL_BY_SECTION[part.section]).filter(Boolean))];
    const hours = Math.floor(exam.totalMinutes / 60);

    return (
        <article className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{exam.level}</span>
                <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">{providerLabel(exam.provider)}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-foreground/70">{f.practice}</span>
            </div>

            <h3 className="text-xl font-bold text-foreground">{exam.title}</h3>
            {exam.description && <p className="text-sm text-foreground/70">{exam.description}</p>}

            <ul className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                    const { icon: Icon, color } = skillMeta(skill);
                    return (
                        <li key={skill} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${color}1f`, color }}>
                            <Icon className="size-3.5" />
                            {SKILL_LABEL[skill]}
                        </li>
                    );
                })}
            </ul>

            <dl className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-xl bg-muted/60 p-3">
                    <dt className="flex items-center gap-1 text-xs text-foreground/60">
                        <Clock className="size-3.5" />
                        {f.totalTime}
                    </dt>
                    <dd className="mt-1 font-bold text-foreground">{f.duration(hours, exam.totalMinutes % 60)}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                    <dt className="flex items-center gap-1 text-xs text-foreground/60">
                        <Target className="size-3.5" />
                        {f.writtenPoints}
                    </dt>
                    <dd className="mt-1 font-bold text-foreground">
                        {formatNumber(exam.writtenMaxPoints)} {f.points}
                    </dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                    <dt className="flex items-center gap-1 text-xs text-foreground/60">
                        <Flag className="size-3.5" />
                        {f.passMark}
                    </dt>
                    <dd className="mt-1 font-bold text-foreground">
                        {formatNumber(exam.writtenPassThreshold)} {f.points}
                    </dd>
                </div>
            </dl>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{f.parts}</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                    {exam.stages.map((stage) => (
                        <li key={stage.label} className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5 last:border-b-0">
                            <span lang="de" className="text-foreground/80">{stage.label}</span>
                            <span className="shrink-0 text-foreground/60">{f.duration(0, stage.minutes)}</span>
                        </li>
                    ))}
                </ul>
                {!exam.oralScoringEnabled && exam.parts.some((part) => part.module === "ORAL") && (
                    <p className="mt-2 text-xs text-foreground/60">{f.oralPractice}</p>
                )}
            </div>

            <ul className="flex flex-col gap-1 text-sm text-foreground/70">
                {f.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                ))}
            </ul>

            <Link
                href={isLoggedIn ? "/dashboard/exam-prep/pruefung" : "/signup"}
                className="btn-primary mt-auto rounded-xl py-3 text-center text-base"
            >
                {isLoggedIn ? f.startMember : f.startNew}
            </Link>
        </article>
    );
}

export default function MockExamFinder() {
    const { m } = useMarketing();
    const f = m.mockTest.finder;
    const [provider, setProvider] = useState<string | null>(null);
    const [level, setLevel] = useState<string | null>(null);

    const { data, isPending, isError, refetch } = useQuery({
        queryKey: ["public", "mock-exams"],
        queryFn: () => getPublicMockExams().then((res) => res.data),
        staleTime: 5 * 60 * 1000,
    });

    const exams = useMemo(() => data ?? [], [data]);
    const providers = useMemo(() => [...new Set(exams.map((e) => e.provider))], [exams]);
    const levels = useMemo(
        () => [...new Set(exams.map((e) => e.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b)),
        [exams],
    );
    const visible = exams.filter((e) => (!provider || e.provider === provider) && (!level || e.level === level));

    return (
        <section id="find" className="container mx-auto scroll-mt-24 px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-foreground md:text-4xl">{f.title}</h2>
                <p className="mt-3 text-lg text-foreground/70">{f.subtitle}</p>
            </div>

            {isPending && (
                <p role="status" className="mt-10 flex items-center justify-center gap-2 text-foreground/60">
                    <Loader2 className="size-5 animate-spin" />
                    {f.loading}
                </p>
            )}

            {isError && (
                <div role="alert" className="mt-10 flex flex-col items-center gap-3 text-center">
                    <p className="text-foreground/70">{f.error}</p>
                    <button type="button" onClick={() => refetch()} className="btn-outline rounded-xl px-5 py-2">
                        {f.retry}
                    </button>
                </div>
            )}

            {!isPending && !isError && exams.length > 0 && (
                <>
                    <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label={f.examLabel}>
                            <span className="me-1 text-sm font-semibold text-foreground/60">{f.examLabel}</span>
                            <Chip active={provider === null} onClick={() => setProvider(null)}>{f.all}</Chip>
                            {providers.map((p) => (
                                <Chip key={p} active={provider === p} onClick={() => setProvider(p)}>{providerLabel(p)}</Chip>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label={f.levelLabel}>
                            <span className="me-1 text-sm font-semibold text-foreground/60">{f.levelLabel}</span>
                            <Chip active={level === null} onClick={() => setLevel(null)}>{f.all}</Chip>
                            {levels.map((l) => (
                                <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Chip>
                            ))}
                        </div>
                    </div>

                    <p aria-live="polite" className="mt-6 text-center text-sm text-foreground/60">{f.count(visible.length)}</p>

                    {visible.length === 0 ? (
                        <p className="mt-6 text-center text-foreground/70">{f.empty}</p>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {visible.map((exam) => (
                                <MockExamCard key={exam.id} exam={exam} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {!isPending && !isError && exams.length === 0 && <p className="mt-10 text-center text-foreground/70">{f.empty}</p>}
        </section>
    );
}
