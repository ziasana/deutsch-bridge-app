"use client";

import { GraduationCap } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

type LoadingProps = {
    message?: string;
};

/**
 * Full-screen loading state shared by page loads and "saving" overlays: the DeutschBridge mark with a soft
 * pulse, an indeterminate bar and a short message. It sits on the app background (slightly translucent so
 * a form underneath stays faintly visible while saving) and never swallows clicks it does not need to.
 */
export default function Loading({ message }: Readonly<LoadingProps>) {
    const { t } = useI18n();
    const text = message ?? t.common.loading;

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm"
        >
            <div className="flex flex-col items-center gap-5">
                <div className="relative flex size-16 items-center justify-center">
                    <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary/25 motion-safe:animate-ping" />
                    <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                        <GraduationCap className="size-8" aria-hidden="true" />
                    </span>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <span className="text-lg font-bold tracking-tight text-foreground">DeutschBridge</span>
                    <div aria-hidden="true" className="h-1 w-40 overflow-hidden rounded-full bg-foreground/10">
                        <div className="loading-sweep h-full w-2/5 rounded-full bg-primary" />
                    </div>
                    {text && <p className="text-sm font-medium text-foreground/60">{text}</p>}
                </div>
            </div>
        </div>
    );
}
