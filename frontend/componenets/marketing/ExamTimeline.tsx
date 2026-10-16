"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Clock } from "lucide-react";
import type { ExamSlug } from "./ExamCard";
import { EXAM_TIMELINE, SKILL_LABEL } from "./examStructure";
import { skillMeta } from "./skillMeta";
import { useMarketing } from "./useMarketing";

/** The exam as one bar: every block is as wide as it is long; selecting a block opens the parts that happen in it. */
export default function ExamTimeline({ slug }: Readonly<{ slug: ExamSlug }>) {
    const { m } = useMarketing();
    const exam = m.exams[slug];
    const blocks = EXAM_TIMELINE[slug];
    const total = blocks.reduce((sum, block) => sum + block.minutes, 0);

    return (
        <TabGroup>
            <div className="flex items-center justify-between gap-4 text-sm text-foreground/60">
                <p>{m.examPage.timelineHint}</p>
                <p className="hidden shrink-0 items-center gap-1.5 font-semibold text-foreground sm:flex">
                    <Clock className="size-4" />
                    {m.examPage.totalTime}: {total} {m.examPage.min}
                </p>
            </div>

            <TabList className="mt-4 flex gap-1.5">
                {blocks.map((block) => {
                    const { icon: Icon, color } = skillMeta(block.skill);
                    return (
                        <Tab
                            key={block.skill}
                            style={{ flexGrow: block.minutes, flexBasis: 0, ["--c" as string]: color }}
                            className="group min-w-[3.75rem] rounded-2xl border-2 border-transparent bg-[color-mix(in_srgb,var(--c)_14%,transparent)] px-3 py-4 text-start outline-none transition hover:bg-[color-mix(in_srgb,var(--c)_24%,transparent)] focus-visible:ring-2 focus-visible:ring-ring data-selected:border-[var(--c)] data-selected:bg-[color-mix(in_srgb,var(--c)_26%,transparent)] data-selected:shadow-md motion-reduce:transition-none"
                        >
                            <Icon className="size-5" style={{ color }} />
                            <span className="mt-2 block truncate text-sm font-bold text-foreground">{SKILL_LABEL[block.skill]}</span>
                            <span className="block text-xs text-foreground/70">
                                {block.minutes} {m.examPage.min}
                            </span>
                        </Tab>
                    );
                })}
            </TabList>

            <TabPanels className="mt-5">
                {blocks.map((block) => (
                    <TabPanel key={block.skill} className="grid gap-4 outline-none md:grid-cols-2 [&>*]:animate-[fade-up_.35s_ease-out] motion-reduce:[&>*]:animate-none">
                        {block.parts.map((index) => {
                            const part = exam.parts[index];
                            const { icon: Icon, color } = skillMeta(part.skill);
                            return (
                                <article key={part.title} className="rounded-2xl border border-border bg-card p-6">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1f`, color }}>
                                            <Icon className="size-5" />
                                        </span>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">{part.title}</h3>
                                            <p className="text-sm text-foreground/60">{part.duration}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-foreground/80">{part.description}</p>
                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {part.tasks.map((task) => (
                                            <li key={task} className="rounded-full bg-muted px-3 py-1 text-sm text-foreground/80">
                                                {task}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            );
                        })}
                    </TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    );
}
