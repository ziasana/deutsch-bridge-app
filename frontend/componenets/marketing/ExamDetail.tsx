"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Check, FileText, GraduationCap, Home, Info, LucideIcon, Users } from "lucide-react";
import CtaBand from "./CtaBand";
import { ExamSlug } from "./ExamCard";
import ExamTimeline from "./ExamTimeline";
import FaqList from "./FaqList";
import LevelExplorer from "./LevelExplorer";
import SectionHeading from "./SectionHeading";
import { skillMeta } from "./skillMeta";
import { useMarketing } from "./useMarketing";

const GOAL_ICONS: Record<string, LucideIcon> = {
    residence: Home,
    citizenship: FileText,
    work: Briefcase,
    study: GraduationCap,
    integration: Users,
};

export default function ExamDetail({ slug }: Readonly<{ slug: ExamSlug }>) {
    const { m } = useMarketing();
    const exam = m.exams[slug];
    const p = m.examPage;
    const other: ExamSlug = slug === "telc" ? "dtz" : "telc";
    useEffect(() => {
        const previous = document.title;
        document.title = `${exam.name} | DeutschBridge`;
        return () => {
            document.title = previous;
        };
    }, [exam.name]);
    const skills = [...new Set(exam.parts.map((part) => part.skill))];

    return (
        <main className="bg-background">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-accent/60 to-background">
                <div aria-hidden className="absolute -end-24 -top-24 size-80 rounded-full bg-primary/10 blur-2xl" />
                <div className="container relative mx-auto px-6 py-14 md:py-20">
                    <Link href="/exams" className="text-sm font-semibold text-primary hover:underline">
                        ← {m.exams.backToExams}
                    </Link>
                    <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
                        <div>
                            <span className="rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-primary shadow-card">{exam.level}</span>
                            <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">{exam.name}</h1>
                            <p className="mt-2 text-xl text-foreground/80">{exam.tagline}</p>
                            <p className="mt-5 max-w-2xl text-lg text-foreground/70">{exam.summary}</p>
                            <p className="mt-3 max-w-2xl text-foreground/60">{exam.audience}</p>
                            <ul className="mt-6 flex flex-wrap gap-2">
                                {skills.map((skill) => {
                                    const { icon: Icon, color } = skillMeta(skill);
                                    return (
                                        <li key={skill} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: `${color}1f`, color }}>
                                            <Icon className="size-4" />
                                            {exam.parts.find((part) => part.skill === skill)?.title}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link href="/signup" className="btn-primary rounded-xl px-6 py-3 text-base">
                                    {m.common.startFree}
                                </Link>
                                <a href="#level" className="btn-outline rounded-xl bg-card px-6 py-3 text-base">
                                    {p.levelBadge}
                                </a>
                            </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-3">
                            {exam.facts.map((fact) => (
                                <div key={fact.label} className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 motion-reduce:transition-none">
                                    <dt className="text-sm text-foreground/60">{fact.label}</dt>
                                    <dd className="mt-1 text-lg font-bold text-foreground">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>

            {/* Level explorer */}
            <section id="level" className="container mx-auto scroll-mt-24 px-6 py-16">
                <SectionHeading badge={p.levelBadge} title={p.levelTitle} subtitle={p.levelSubtitle} />
                <div className="mx-auto mt-10 max-w-5xl">
                    <LevelExplorer slug={slug} />
                </div>
            </section>

            {/* Timeline */}
            <section className="bg-muted/50 py-16">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={p.timelineBadge} title={p.timelineTitle} />
                    <div className="mx-auto mt-10 max-w-5xl">
                        <ExamTimeline slug={slug} />
                        <p className="mt-6 flex items-start gap-2 text-sm text-foreground/60">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            {m.exams.officialNote}
                        </p>
                    </div>
                </div>
            </section>

            {/* Goals */}
            <section className="container mx-auto px-6 py-16">
                <SectionHeading title={p.goalsTitle} subtitle={p.goalsSubtitle} />
                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {p.goals[slug].map((goal) => {
                        const Icon = GOAL_ICONS[goal.icon] ?? Home;
                        return (
                            <div key={goal.title} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg motion-reduce:transition-none">
                                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                                    <Icon className="size-5" />
                                </span>
                                <h3 className="mt-4 font-bold text-foreground">{goal.title}</h3>
                                <p className="mt-2 text-sm text-foreground/70">{goal.text}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Included + FAQ */}
            <section className="bg-muted/50 py-16">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-6 lg:grid-cols-2">
                    <div>
                        <SectionHeading align="start" title={m.exams.includedTitle} />
                        <ul className="mt-6 flex flex-col gap-3">
                            {exam.included.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-foreground/80">
                                    <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                            <h3 className="font-bold text-foreground">{p.mock.title}</h3>
                            <p className="mt-1 text-sm text-foreground/70">{p.mock.text}</p>
                            <Link href="/mock-test" className="mt-4 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                                {p.mock.cta}
                                <ArrowRight className="size-4 rtl:rotate-180" />
                            </Link>
                        </div>
                    </div>
                    <div>
                        <SectionHeading align="start" title={m.exams.faqTitle} />
                        <div className="mt-6">
                            <FaqList items={exam.faqs} />
                        </div>
                    </div>
                </div>
            </section>

            <CtaBand title={m.exams.ctaTitle} text={m.exams.ctaText} />

            <div className="container mx-auto flex flex-col items-center gap-2 px-6 pb-10 text-center">
                <Link href={`/exams/${other}`} className="flex items-center gap-2 font-semibold text-primary hover:underline">
                    {m.exams.otherExam} {m.exams[other].name}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
                <p className="text-xs text-foreground/50">{m.common.disclaimer}</p>
            </div>
        </main>
    );
}
