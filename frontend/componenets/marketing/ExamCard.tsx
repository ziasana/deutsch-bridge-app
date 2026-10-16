"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { skillMeta } from "./skillMeta";
import { useMarketing } from "./useMarketing";

export type ExamSlug = "telc" | "dtz";

export default function ExamCard({ slug }: Readonly<{ slug: ExamSlug }>) {
    const { m } = useMarketing();
    const exam = m.exams[slug];

    return (
        <Link
            href={`/exams/${slug}`}
            className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-7 shadow-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-primary">{exam.level}</p>
                    <h3 className="mt-1 text-2xl font-bold text-foreground">{exam.name}</h3>
                </div>
            </div>

            <p className="text-foreground/70">{exam.tagline}</p>

            <ul className="flex flex-wrap gap-2">
                {exam.parts.map((part) => {
                    const { icon: Icon, color } = skillMeta(part.skill);
                    return (
                        <li
                            key={part.title}
                            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ backgroundColor: `${color}1f`, color }}
                        >
                            <Icon className="size-3.5" />
                            {part.title}
                        </li>
                    );
                })}
            </ul>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="flex items-center gap-1.5 text-foreground/60">
                    <Clock className="size-4" />
                    {exam.facts[1].value}
                </span>
                <span className="flex items-center gap-1 font-semibold text-primary">
                    {m.common.viewExam}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
            </div>
        </Link>
    );
}
