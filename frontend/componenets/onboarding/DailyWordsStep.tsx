"use client";

import StepHeader from "@/componenets/onboarding/StepHeader";
import useOnboardingStore from "@/store/useOnboardingStore";
import { DAILY_WORD_OPTIONS } from "@/componenets/onboarding/onboardingOptions";
import { cn } from "@/lib/utils";

export default function DailyWordsStep() {
    const { dailyGoalWords, setDailyGoalWords } = useOnboardingStore();

    return (
        <div>
            <StepHeader title="How many new words would you like to learn each day?" subtitle="Choose a pace that feels realistic for you." />
            <div className="grid grid-cols-2 gap-3">
                {DAILY_WORD_OPTIONS.map((opt) => {
                    const active = dailyGoalWords === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setDailyGoalWords(opt.value)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-2xl border p-6 transition-all duration-200",
                                active
                                    ? "border-primary bg-primary/[0.06]"
                                    : "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lg",
                            )}
                        >
                            <span className={cn("text-3xl font-bold", active ? "text-primary" : "text-foreground")}>{opt.value}</span>
                            <span className="text-sm text-foreground/55">words/day</span>
                            <span className={cn("mt-1 text-xs font-medium", active ? "text-primary" : "text-foreground/45")}>{opt.pace}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
