"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { getPublicExamCounts } from "@/services/examService";
import type { PublicExamCount } from "@/types/exam";
import type { ExamSlug } from "./ExamCard";
import { EXAM_LEVELS, SECTION_SKILL, SKILL_LABEL } from "./examStructure";
import { skillMeta } from "./skillMeta";
import { useMarketing } from "./useMarketing";

const SKILL_ORDER = ["lesen", "sprachbausteine", "hoeren", "schreiben", "sprechen"];
const GROUP_TONE: Record<string, string> = {
    basic: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    independent: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    proficient: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

/** Counts per skill for one exam and stored level. */
function skillCounts(rows: PublicExamCount[], slug: ExamSlug, level: string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of rows) {
        if (row.examType !== slug.toUpperCase() || row.level !== level) continue;
        const skill = SECTION_SKILL[row.section];
        if (skill) counts[skill] = (counts[skill] ?? 0) + row.count;
    }
    return counts;
}

function SkillBars({ counts, max }: Readonly<{ counts: Record<string, number>; max: number }>) {
    const { m } = useMarketing();
    // Bars grow from zero after mount (and on every level change) so the numbers read as a visual.
    const [grown, setGrown] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setGrown(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{m.examPage.perSkill}</p>
            <ul className="mt-3 flex flex-col gap-3">
                {SKILL_ORDER.filter((skill) => counts[skill]).map((skill) => {
                    const { icon: Icon, color } = skillMeta(skill);
                    return (
                        <li key={skill}>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 font-semibold text-foreground">
                                    <Icon className="size-4" style={{ color }} />
                                    {SKILL_LABEL[skill]}
                                </span>
                                <span className="text-foreground/70">{counts[skill]}</span>
                            </div>
                            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                                    style={{ width: grown ? `${Math.max(6, (counts[skill] / max) * 100)}%` : "0%", backgroundColor: color }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

type LevelData = { key: string; label: string; counts: Record<string, number>; total: number };

function LevelPanel({ level, examName }: Readonly<{ level: LevelData; examName: string }>) {
    const { m } = useMarketing();
    const p = m.examPage;
    const info = p.levels[level.key as keyof typeof p.levels];
    const max = Math.max(1, ...Object.values(level.counts));
    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-xl bg-primary px-4 py-2 text-2xl font-extrabold text-primary-foreground">{level.label}</span>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">{info.name}</h3>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${GROUP_TONE[info.group]}`}>
                            {p.groups[info.group as keyof typeof p.groups]}
                        </span>
                    </div>
                </div>
                <p className="text-foreground/80">{info.canDo}</p>
                <p className="rounded-xl bg-muted/60 p-4 text-sm text-foreground/70">{info.goal}</p>
                {level.total > 0 && (
                    <Link href="/signup" className="btn-primary mt-auto flex w-fit items-center gap-2 rounded-xl px-5 py-3">
                        {p.practiceCta(examName, level.label)}
                        <ArrowRight className="size-4 rtl:rotate-180" />
                    </Link>
                )}
            </div>

            <div>
                {level.total > 0 ? (
                    <>
                        <p className="mb-5 text-3xl font-extrabold text-primary">
                            {level.total} <span className="text-base font-semibold text-foreground/70">{p.exercisesReady}</span>
                        </p>
                        <SkillBars key={level.key} counts={level.counts} max={max} />
                    </>
                ) : (
                    <div className="flex h-full min-h-40 flex-col items-start justify-center gap-2 rounded-2xl border border-dashed border-border p-6">
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{p.soon}</span>
                        <p className="text-foreground/70">{p.soonText}</p>
                    </div>
                )}
            </div>
        </>
    );
}

const PANEL_CLASS =
    "grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-card outline-none md:grid-cols-2 md:p-8 [&>*]:animate-[fade-up_.35s_ease-out] motion-reduce:[&>*]:animate-none";

export default function LevelExplorer({ slug }: Readonly<{ slug: ExamSlug }>) {
    const { m } = useMarketing();
    const p = m.examPage;
    const levels = EXAM_LEVELS[slug];
    const examName = slug === "telc" ? "telc" : "DTZ";

    const { data } = useQuery({
        queryKey: ["public", "exam-counts"],
        queryFn: () => getPublicExamCounts().then((res) => res.data),
        staleTime: 5 * 60 * 1000,
    });
    const rows = useMemo(() => data ?? [], [data]);

    const perLevel = useMemo(
        () =>
            levels.map((level) => {
                const counts = skillCounts(rows, slug, level.storedLevel);
                return { ...level, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
            }),
        [levels, rows, slug],
    );
    const firstReady = Math.max(0, perLevel.findIndex((l) => l.total > 0));

    if (levels.length === 1) {
        return (
            <div className={PANEL_CLASS}>
                <LevelPanel level={perLevel[0]} examName={examName} />
            </div>
        );
    }

    return (
        <TabGroup defaultIndex={firstReady} key={firstReady}>
            <TabList className="grid grid-cols-5 gap-2 sm:gap-3">
                {perLevel.map((level) => (
                    <Tab
                        key={level.key}
                        className="group relative flex flex-col items-center gap-1 rounded-2xl border-2 border-border bg-card px-2 py-4 outline-none transition hover:-translate-y-0.5 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring data-selected:border-primary data-selected:bg-primary data-selected:text-primary-foreground data-selected:shadow-lg motion-reduce:transition-none"
                    >
                        <span className="text-2xl font-extrabold sm:text-3xl">{level.label}</span>
                        <span className="text-[11px] font-semibold opacity-80">{level.total > 0 ? p.ready : p.soon}</span>
                        {level.total > 0 && (
                            <span aria-hidden className="absolute end-2 top-2 size-2 rounded-full bg-emerald-500 ring-2 ring-card group-data-selected:ring-primary" />
                        )}
                    </Tab>
                ))}
            </TabList>

            <TabPanels className="mt-6">
                {perLevel.map((level) => (
                    <TabPanel key={level.key} className={PANEL_CLASS}>
                        <LevelPanel level={level} examName={examName} />
                    </TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    );
}
