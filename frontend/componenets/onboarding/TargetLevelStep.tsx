"use client";

import StepHeader from "@/componenets/onboarding/StepHeader";
import SelectionCard from "@/componenets/onboarding/SelectionCard";
import useOnboardingStore from "@/store/useOnboardingStore";
import { CEFR_LEVELS, CEFR_ORDER } from "@/componenets/onboarding/onboardingOptions";

export default function TargetLevelStep() {
    const { currentLevel, currentLevelUnknown, targetLevel, setTargetLevel } = useOnboardingStore();
    const currentIndex = currentLevel ? CEFR_ORDER.indexOf(currentLevel) : -1;

    return (
        <div>
            <StepHeader title="What level do you want to reach?" subtitle="We'll use this goal to guide your learning path." />
            <div className="space-y-3">
                {CEFR_LEVELS.map((level) => {
                    const disabled = !currentLevelUnknown && CEFR_ORDER.indexOf(level.code) <= currentIndex;
                    return (
                        <SelectionCard
                            key={level.code}
                            label={level.label}
                            active={targetLevel === level.code}
                            disabled={disabled}
                            onClick={() => setTargetLevel(level.code)}
                        />
                    );
                })}
            </div>
            {!currentLevelUnknown && currentLevel && (
                <p className="mt-3 text-xs text-foreground/45">Your target level should be higher than your current level ({currentLevel}).</p>
            )}
        </div>
    );
}
