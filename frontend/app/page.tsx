"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDown, Play, Quote, Star } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

const HERO_IMAGE =
    "https://images.unsplash.com/photo-1615914143778-1a1a6e50c5dd?auto=format&fit=crop&w=1200&q=80";
const FAQ_IMAGE =
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80";
const TESTIMONIAL_IMAGES = [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
];
const BLOG_IMAGES = [
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
];

function useCountUp(target: number, active: boolean) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!active) return;
        const duration = 1500;
        const start = performance.now();

        let frame: number;
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [active, target]);

    return value;
}

function StatCounter({ value, suffix, label }: Readonly<{ value: number; suffix: string; label: string }>) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setActive(true);
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const count = useCountUp(value, active);

    return (
        <div ref={ref} className="text-center">
            <p className="text-4xl md:text-5xl font-bold text-white">
                {count.toLocaleString()}
                {suffix}
            </p>
            <p className="mt-2 text-primary-foreground/70">{label}</p>
        </div>
    );
}

export default function HomePage() {
    const { t } = useI18n();
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    return (
        <main className="bg-background transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-accent/60 to-background">
                <div className="container mx-auto px-6 py-20 md:py-28 flex flex-col-reverse md:flex-row items-center gap-14">
                    {/* Text Content */}
                    <div className="md:w-1/2 flex flex-col gap-6">
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                            {t.home.hero.titleStart}{" "}
                            <span className="inline-block rounded-lg bg-primary/15 px-2 text-primary">
                                {t.home.hero.titleHighlight}
                            </span>{" "}
                            {t.home.hero.titleEnd}
                        </h1>

                        <p className="text-lg text-foreground/70">{t.home.hero.subtitle}</p>

                        <ul className="flex flex-col gap-3">
                            {t.home.hero.bullets.map((bullet) => (
                                <li key={bullet} className="flex items-center gap-3 text-foreground/80">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs">
                                        ✓
                                    </span>
                                    {bullet}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link href="/signup" className="btn-primary rounded-xl px-6 py-3 text-base">
                                {t.home.hero.ctaPrimary}
                            </Link>
                            <button
                                type="button"
                                className="flex items-center gap-3 font-semibold text-foreground hover:text-primary transition"
                            >
                                <span className="flex size-11 items-center justify-center rounded-full bg-card shadow-card">
                                    <Play className="size-4 fill-current" />
                                </span>
                                {t.home.hero.ctaSecondary}
                            </button>
                        </div>
                    </div>

                    {/* Illustration */}
                    <div className="md:w-1/2 flex justify-center">
                        <div className="relative w-full max-w-xl">
                            {/* Decorative dotted grid, matches the accent behind the image */}
                            <div
                                aria-hidden
                                className="absolute -right-4 -top-4 size-24 opacity-40 [background-image:radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:12px_12px]"
                            />

                            <div className="overflow-hidden rounded-[2.5rem] shadow-card">
                                <Image
                                    src={HERO_IMAGE}
                                    alt="A learner writing German notes in a notebook next to a laptop"
                                    width={1200}
                                    height={800}
                                    className="h-[320px] sm:h-[420px] md:h-[560px] w-full object-cover"
                                    priority
                                />
                            </div>

                            {/* Floating stat cards */}
                            <div className="animate-float absolute -left-6 top-10 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card transition-transform duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-lg cursor-default">
                                <Star className="size-5 fill-yellow-400 text-yellow-400" />
                                <div>
                                    <p className="font-bold text-foreground leading-none">{t.home.hero.statRating.value}</p>
                                    <p className="text-xs text-foreground/60">{t.home.hero.statRating.label}</p>
                                </div>
                            </div>

                            <div
                                className="animate-float-slow absolute -right-4 bottom-28 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-card transition-transform duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-lg cursor-default"
                                style={{ animationDelay: "0.6s" }}
                            >
                                <p className="font-bold leading-none">{t.home.hero.statCourses.value}</p>
                                <p className="text-xs text-primary-foreground/80">{t.home.hero.statCourses.label}</p>
                            </div>

                            <div
                                className="animate-float absolute -bottom-6 left-6 rounded-2xl bg-card px-4 py-3 shadow-card transition-transform duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-lg cursor-default"
                                style={{ animationDelay: "1.2s" }}
                            >
                                <p className="font-bold text-foreground leading-none">{t.home.hero.statStudents.value}</p>
                                <p className="text-xs text-foreground/60">{t.home.hero.statStudents.label}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="features" className="scroll-mt-24 container mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
                <div className="flex flex-col gap-4 order-2 md:order-1">
                    <span className="w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                        {t.home.faq.badge}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t.home.faq.title}</h2>
                    <p className="text-lg text-foreground/70">{t.home.faq.description}</p>

                    <div className="mt-2 flex flex-col gap-3">
                        {t.home.faq.items.map((item, index) => (
                            <Disclosure key={item.question} defaultOpen={index === 0}>
                                {({ open }) => (
                                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                                        <DisclosureButton className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-foreground">
                                            {item.question}
                                            <ChevronDown
                                                className={`size-5 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`}
                                            />
                                        </DisclosureButton>
                                        <DisclosurePanel className="px-5 pb-4 text-sm text-foreground/70">
                                            {item.answer}
                                        </DisclosurePanel>
                                    </div>
                                )}
                            </Disclosure>
                        ))}
                    </div>
                </div>

                <div className="relative order-1 md:order-2">
                    <div className="overflow-hidden rounded-[2.5rem] shadow-card">
                        <Image
                            src={FAQ_IMAGE}
                            alt="A learner reviewing German flashcards"
                            width={600}
                            height={700}
                            className="h-[420px] w-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-6 right-6 rounded-2xl bg-primary px-6 py-4 text-center text-primary-foreground shadow-card">
                        <p className="text-2xl font-bold leading-none">{t.home.faq.statValue}</p>
                        <p className="mt-1 text-xs text-primary-foreground/80">{t.home.faq.statLabel}</p>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-3 mb-12">
                    <span className="w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                        {t.home.testimonials.badge}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t.home.testimonials.title}</h2>
                </div>

                <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 text-center">
                    <div className="flex items-center justify-center rounded-full bg-primary/15 p-3">
                        <Quote className="size-6 text-primary" />
                    </div>

                    <div className="flex items-center gap-1 text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="size-5 fill-current" />
                        ))}
                    </div>

                    <p className="text-lg md:text-xl italic text-foreground/80">
                        “{t.home.testimonials.items[activeTestimonial].quote}”
                    </p>

                    <div className="flex items-center gap-3">
                        <Image
                            src={TESTIMONIAL_IMAGES[activeTestimonial]}
                            alt={t.home.testimonials.items[activeTestimonial].name}
                            width={48}
                            height={48}
                            className="size-12 rounded-full object-cover"
                        />
                        <div className="text-left">
                            <p className="font-semibold text-foreground">
                                {t.home.testimonials.items[activeTestimonial].name}
                            </p>
                            <p className="text-sm text-foreground/60">{t.home.testimonials.items[activeTestimonial].role}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        {t.home.testimonials.items.map((item, index) => (
                            <button
                                key={item.name}
                                type="button"
                                aria-label={`Show testimonial from ${item.name}`}
                                onClick={() => setActiveTestimonial(index)}
                                className={`size-2.5 rounded-full transition ${
                                    index === activeTestimonial ? "bg-primary w-6" : "bg-border"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Counter Band */}
            <section id="about" className="scroll-mt-24 bg-primary py-16">
                <div className="container mx-auto px-6 flex flex-col items-center gap-12">
                    <h2 className="max-w-3xl text-center text-3xl md:text-4xl font-bold text-white">
                        {t.home.stats.titleStart}{" "}
                        <span className="rounded-lg bg-white/15 px-2">{t.home.stats.titleHighlight}</span>{" "}
                        {t.home.stats.titleEnd}
                    </h2>

                    <div className="grid grid-cols-2 gap-10 md:gap-24">
                        {t.home.stats.items.map((item) => (
                            <StatCounter key={item.label} value={item.value} suffix={item.suffix} label={item.label} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Blog / News Section */}
            <section id="blog" className="scroll-mt-24 container mx-auto px-6 py-20">
                <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-3 mb-12">
                    <span className="w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                        {t.home.blog.badge}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t.home.blog.title}</h2>
                    <p className="text-lg text-foreground/70">{t.home.blog.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.home.blog.posts.map((post, index) => (
                        <article
                            key={post.title}
                            className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-lg transition"
                        >
                            <div className="relative h-48 w-full">
                                <Image src={BLOG_IMAGES[index]} alt={post.title} fill className="object-cover" />
                                <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-card">
                                    {post.category}
                                </span>
                            </div>
                            <div className="flex flex-col gap-3 p-6">
                                <h3 className="text-lg font-semibold text-foreground leading-snug">{post.title}</h3>
                                <p className="text-sm text-foreground/60">
                                    {post.author} · {post.date}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
