"use client";

import StepHeader from "@/componenets/onboarding/StepHeader";
import SelectionCard from "@/componenets/onboarding/SelectionCard";
import useOnboardingStore from "@/store/useOnboardingStore";
import { FOCUS_AREA_OPTIONS } from "@/componenets/onboarding/onboardingOptions";

export default function FocusAreasStep() {
    const { focusAreas, toggleFocusArea } = useOnboardingStore();

    return (
        <div>
            <StepHeader title="What would you like to improve?" subtitle="Choose up to 3 areas you'd like to focus on." />
            <div className="space-y-3">
                {FOCUS_AREA_OPTIONS.map((opt) => {
                    const active = focusAreas.includes(opt.value);
                    const disabled = !active && focusAreas.length >= 3;
                    return (
                        <SelectionCard
                            key={opt.value}
                            label={opt.label}
                            description={opt.description}
                            icon={opt.icon}
                            multi
                            active={active}
                            disabled={disabled}
                            onClick={() => toggleFocusArea(opt.value)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
