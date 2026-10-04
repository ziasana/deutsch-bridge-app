"use client";

import { PartyPopper } from "lucide-react";
import { Button } from "@/componenets/ui/button";
import { FOCUS_AREA_OPTIONS } from "@/componenets/onboarding/onboardingOptions";
import { LearningFocus } from "@/types/onboarding";

interface OnboardingCompleteProps {
    targetLevel: string;
    focusAreas: LearningFocus[];
    dailyGoalWords: number;
    onStart: () => void;
}

export default function OnboardingComplete({ targetLevel, focusAreas, dailyGoalWords, onStart }: OnboardingCompleteProps) {
    const selectedFocus = FOCUS_AREA_OPTIONS.filter((opt) => focusAreas.includes(opt.value));

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-10 flex items-center justify-center">
            <div className="relative w-full max-w-xl overflow-hidden [&>*:not([aria-hidden])]:relative text-center rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-card p-8 sm:p-10 shadow-card">
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/[0.06]" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/4 size-36 rounded-full bg-primary/[0.04]" />
                <span className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <PartyPopper className="size-8" aria-hidden="true" />
                </span>
                <h1 className="text-2xl font-bold text-foreground">Your German learning plan is ready!</h1>
                <p className="mt-2 text-foreground/60">
                    You&apos;re working toward <span className="font-semibold text-foreground">{targetLevel}</span>.
                </p>

                {selectedFocus.length > 0 && (
                    <div className="mt-6">
                        <p className="text-sm text-foreground/55 mb-3">We&apos;ll help you focus on:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {selectedFocus.map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <span
                                        key={opt.value}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-accent text-primary px-3 py-1.5 text-sm font-medium"
                                    >
                                        <Icon className="size-4" />
                                        {opt.label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="relative mt-8 rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-sm text-foreground/55">Your daily vocabulary goal</p>
                    <p className="text-3xl font-bold text-primary mt-1">{dailyGoalWords} words</p>
                </div>

                <Button type="button" size="lg" onClick={onStart} className="mt-8 gap-1.5 rounded-full px-8">
                    Start learning →
                </Button>
            </div>
        </div>
    );
}
