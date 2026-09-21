"use client";

import StepHeader from "@/componenets/onboarding/StepHeader";
import SelectionCard from "@/componenets/onboarding/SelectionCard";
import useOnboardingStore from "@/store/useOnboardingStore";

export default function ExplanationLanguageStep() {
    const { explanationLanguage, setExplanationLanguage } = useOnboardingStore();

    return (
        <div>
            <StepHeader
                title="How would you like us to explain German?"
                subtitle="Choose the language that feels most comfortable for explanations and translations."
            />
            <div className="space-y-3">
                <SelectionCard
                    emoji="🇬🇧"
                    label="English"
                    description="German explanations with English support"
                    active={explanationLanguage === "EN"}
                    onClick={() => setExplanationLanguage("EN")}
                />
                <SelectionCard
                    emoji="🇮🇷"
                    label="فارسی"
                    description="توضیحات و ترجمه‌های آلمانی به فارسی"
                    active={explanationLanguage === "PR"}
                    onClick={() => setExplanationLanguage("PR")}
                />
            </div>
            <p className="mt-4 text-xs text-foreground/45">
                German stays your target language — this only changes the language of grammar tips, vocabulary meanings and instructions.
            </p>
        </div>
    );
}
