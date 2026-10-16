"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import BlogCard from "@/componenets/blog/BlogCard";
import BlogCardSkeleton from "@/componenets/blog/BlogCardSkeleton";
import CtaBand from "@/componenets/marketing/CtaBand";
import ExamCard from "@/componenets/marketing/ExamCard";
import { FEATURE_ICONS } from "@/componenets/marketing/FeatureIcons";
import FaqList from "@/componenets/marketing/FaqList";
import PreviewTeaser from "@/componenets/marketing/learn/PreviewTeaser";
import PricingCards from "@/componenets/marketing/PricingCards";
import SampleQuestion from "@/componenets/marketing/SampleQuestion";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { skillMeta } from "@/componenets/marketing/skillMeta";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { getHomeBlogPosts } from "@/services/blogService";

const HERO_IMAGE = "/images/hero-image.jpg";

export default function HomePage() {
    const { m } = useMarketing();
    const home = m.home;
    const { data: blogPosts, isPending: blogPending } = useQuery({
        queryKey: ["blog", "latest"],
        queryFn: () => getHomeBlogPosts(3).then((res) => res.data),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <main className="bg-background transition-colors duration-300">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-accent/60 to-background">
                <div className="container mx-auto flex flex-col items-center gap-14 px-6 py-12 md:flex-row md:py-24">
                    <div className="flex flex-col gap-6 md:w-1/2">
                        <span className="w-fit rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-primary shadow-card">{home.hero.badge}</span>
                        <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
                            {home.hero.titleStart}{" "}
                            <span className="inline-block rounded-lg bg-primary/15 px-2 text-primary">{home.hero.titleHighlight}</span>
                        </h1>
                        <p className="text-lg text-foreground/70">{home.hero.subtitle}</p>

                        <ul className="flex flex-col gap-3">
                            {home.hero.bullets.map((bullet) => (
                                <li key={bullet} className="flex items-center gap-3 text-foreground/80">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                                        <Check className="size-3.5" />
                                    </span>
                                    {bullet}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link href="/signup" className="btn-primary rounded-xl px-6 py-3 text-base">
                                {m.common.startFree}
                            </Link>
                            <Link href="/exams" className="btn-outline rounded-xl bg-card px-6 py-3 text-base">
                                {m.common.exploreExams}
                            </Link>
                        </div>
                        <p className="text-sm text-foreground/60">{m.common.noCard}</p>
                    </div>

                    <div className="flex justify-center md:w-1/2">
                        <div className="relative w-full max-w-xl">
                            <div
                                aria-hidden
                                className="absolute -right-4 -top-4 size-24 opacity-40 [background-image:radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:12px_12px]"
                            />
                            <div className="overflow-hidden rounded-[2.5rem] shadow-card">
                                <Image
                                    src={HERO_IMAGE}
                                    alt="A learner writing German notes in a notebook next to a laptop"
                                    width={800}
                                    height={700}
                                    className="h-[380px] w-full object-cover md:h-[420px]"
                                    priority
                                />
                            </div>
                            <div className="absolute -bottom-6 start-4 end-4 flex justify-between gap-2 rounded-2xl border border-border bg-card p-3 shadow-card sm:start-8 sm:end-8">
                                {home.hero.chips.map((chip) => (
                                    <div key={chip.label} className="flex-1 text-center">
                                        <p className="text-xl font-bold text-primary">{chip.value}</p>
                                        <p className="text-xs text-foreground/60">{chip.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Choose your exam */}
            <section id="exams" className="container mx-auto scroll-mt-24 px-6 py-20">
                <SectionHeading badge={home.exams.badge} title={home.exams.title} subtitle={home.exams.subtitle} />
                <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
                    <ExamCard slug="telc" />
                    <ExamCard slug="dtz" />
                </div>
            </section>

            {/* Four skills */}
            <section className="bg-muted/50 py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={home.skills.badge} title={home.skills.title} subtitle={home.skills.subtitle} />
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {home.skills.items.map((item) => {
                            const { icon: Icon, color } = skillMeta(item.skill);
                            return (
                                <div key={item.skill} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                                    <span className="flex size-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1f`, color }}>
                                        <Icon className="size-6" />
                                    </span>
                                    <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                                    <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="container mx-auto px-6 py-20">
                <SectionHeading badge={home.how.badge} title={home.how.title} />
                <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
                    {home.how.steps.map((step, index) => (
                        <li key={step.title} className="flex gap-5 rounded-2xl border border-border bg-card p-6">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                                {index + 1}
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                                <p className="mt-1 text-foreground/70">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Try a sample */}
            <section className="bg-gradient-to-b from-accent/50 to-background py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={home.sample.badge} title={home.sample.title} subtitle={home.sample.subtitle} />
                    <div className="mt-10">
                        <SampleQuestion />
                    </div>
                </div>
            </section>

            {/* Real content teaser */}
            <PreviewTeaser />

            {/* Pricing teaser */}
            <section className="bg-muted/50 py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={home.pricing.badge} title={home.pricing.title} subtitle={home.pricing.subtitle} />
                    <div className="mt-12">
                        <PricingCards />
                    </div>
                    <div className="mt-8 flex justify-center">
                        <Link href="/pricing" className="font-semibold text-primary hover:underline">
                            {m.common.seePricing}
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="container mx-auto scroll-mt-24 px-6 py-20">
                <SectionHeading badge={home.faq.badge} title={home.faq.title} />
                <div className="mx-auto mt-10 max-w-3xl">
                    <FaqList items={home.faq.items} />
                </div>
            </section>

            {/* Blog - admin-managed (see /admin/blog); hidden until there is something published */}
            {(blogPending || (blogPosts?.length ?? 0) > 0) && (
                <section id="blog" className="container mx-auto scroll-mt-24 px-6 pb-20">
                    <SectionHeading badge={home.blog.badge} title={home.blog.title} subtitle={home.blog.subtitle} />
                    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {blogPending
                            ? [0, 1, 2].map((i) => <BlogCardSkeleton key={i} />)
                            : blogPosts?.map((post) => <BlogCard key={post.slug} post={post} />)}
                    </div>
                    <div className="mt-12 flex justify-center">
                        <Link href="/blog" className="btn-primary rounded-xl px-6 py-3 text-base">
                            {home.blog.viewAll}
                        </Link>
                    </div>
                </section>
            )}

            <CtaBand title={home.finalCta.title} text={home.finalCta.text} />

            <p className="container mx-auto px-6 pb-10 text-center text-xs text-foreground/50">{m.common.disclaimer}</p>
        </main>
    );
}
