"use client";

import StepHeader from "@/componenets/onboarding/StepHeader";
import SelectionCard from "@/componenets/onboarding/SelectionCard";
import useOnboardingStore from "@/store/useOnboardingStore";
import { LEARNING_REASON_OPTIONS } from "@/componenets/onboarding/onboardingOptions";

export default function LearningReasonStep() {
    const { learningReasons, toggleLearningReason } = useOnboardingStore();

    return (
        <div>
            <StepHeader title="Why are you learning German?" subtitle="Your goal helps us personalize your learning experience." />
            <div className="space-y-3">
                {LEARNING_REASON_OPTIONS.map((opt) => (
                    <SelectionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        icon={opt.icon}
                        multi
                        active={learningReasons.includes(opt.value)}
                        onClick={() => toggleLearningReason(opt.value)}
                    />
                ))}
            </div>
        </div>
    );
}
