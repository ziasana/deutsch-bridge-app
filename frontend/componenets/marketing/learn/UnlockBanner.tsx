"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useMarketing } from "../useMarketing";

/** The call to action under a topic or a list: what signing up opens. Styled like the dashboard's category-test banner. */
export default function UnlockBanner({ title }: Readonly<{ title: string }>) {
    const { m } = useMarketing();
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 p-4 ring-1 ring-primary/20">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Lock className="size-5" aria-hidden="true" />
                </span>
                <p className="min-w-0 font-bold text-foreground">{title}</p>
            </div>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                {m.learnPage.unlock.cta}
            </Link>
        </div>
    );
}
