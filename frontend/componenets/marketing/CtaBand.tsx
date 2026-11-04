"use client";

import AuthAwareLink from "@/componenets/AuthAwareLink";
import { useMarketing } from "./useMarketing";

export default function CtaBand({ title, text }: Readonly<{ title: string; text: string }>) {
    const { m } = useMarketing();
    return (
        <section className="container mx-auto px-6 py-16">
            <div className="rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground shadow-card md:px-12">
                <h2 className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">{title}</h2>
                <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">{text}</p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <AuthAwareLink
                        href="/signup"
                        className="rounded-xl bg-card px-6 py-3 text-base font-semibold text-primary shadow transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        {m.common.startFree}
                    </AuthAwareLink>
                    <AuthAwareLink href="/login" className="rounded-xl border border-white/40 px-6 py-3 text-base font-semibold transition hover:bg-white/10">
                        {m.common.login}
                    </AuthAwareLink>
                </div>
                <p className="mt-4 text-sm text-primary-foreground/70">{m.common.noCard}</p>
            </div>
        </section>
    );
}
