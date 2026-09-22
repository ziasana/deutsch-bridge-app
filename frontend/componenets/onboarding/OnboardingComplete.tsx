"use client";

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
            <div className="w-full max-w-xl text-center bg-card rounded-2xl shadow-card border border-border/60 p-8 sm:p-10">
                <div className="text-5xl mb-4">🎉</div>
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

                <div className="mt-8">
                    <p className="text-sm text-foreground/55">Your daily vocabulary goal</p>
                    <p className="text-3xl font-bold text-primary mt-1">{dailyGoalWords} words</p>
                </div>

                <Button type="button" size="lg" onClick={onStart} className="mt-8 gap-1.5">
                    Start learning →
                </Button>
            </div>
        </div>
    );
}
