"use client";

import { Info } from "lucide-react";
import { useMarketing } from "../useMarketing";

/**
 * Tells a visitor that a list is a sample. The "X of Y" part only appears when the list really is capped.
 */
export default function SampleNotice({ shown, total }: Readonly<{ shown: number; total: number }>) {
    const { m } = useMarketing();
    const s = m.learnPage.sample;
    return (
        <p className="mt-5 flex flex-wrap items-start gap-x-2 gap-y-1 rounded-2xl bg-foreground/[0.04] px-4 py-3 text-sm text-foreground/70" role="note">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">{s.label}</span>
            <span aria-hidden="true">·</span>
            <span>{s.note}</span>
            {shown < total && <span className="basis-full ps-6 font-medium text-foreground/80">{s.showing(shown, total)}</span>}
        </p>
    );
}
