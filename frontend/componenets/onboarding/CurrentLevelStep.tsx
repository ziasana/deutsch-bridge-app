"use client";

import { useState } from "react";
import StepHeader from "@/componenets/onboarding/StepHeader";
import SelectionCard from "@/componenets/onboarding/SelectionCard";
import useOnboardingStore from "@/store/useOnboardingStore";
import { CEFR_LEVELS } from "@/componenets/onboarding/onboardingOptions";
import { cn } from "@/lib/utils";

export default function CurrentLevelStep() {
    const { currentLevel, currentLevelUnknown, setCurrentLevel } = useOnboardingStore();
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div>
            <StepHeader title="What is your current German level?" subtitle="Choose the level that best describes your German today." />
            <div className="space-y-3">
                {CEFR_LEVELS.map((level) => (
                    <SelectionCard
                        key={level.code}
                        label={level.label}
                        active={!currentLevelUnknown && currentLevel === level.code}
                        onClick={() => setCurrentLevel(level.code, false)}
                    />
                ))}
                <SelectionCard
                    label="Not sure"
                    description="We'll suggest a starting point and refine it as you learn"
                    active={currentLevelUnknown}
                    onClick={() => setCurrentLevel(undefined, true)}
                />
            </div>

            <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                className="mt-4 text-sm text-primary hover:underline"
            >
                Not sure about your level?
            </button>

            {showGuide && (
                <div className={cn("mt-3 rounded-xl bg-accent/50 p-4 space-y-2")}>
                    {CEFR_LEVELS.map((level) => (
                        <p key={level.code} className="text-sm text-foreground/70">
                            <span className="font-semibold text-foreground">{level.code}</span> — {level.description}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
