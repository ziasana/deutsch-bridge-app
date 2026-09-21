"use client";

import StepHeader from "@/componenets/onboarding/StepHeader";
import SelectionCard from "@/componenets/onboarding/SelectionCard";
import useOnboardingStore from "@/store/useOnboardingStore";
import { CEFR_LEVELS, EXAM_TYPE_OPTIONS } from "@/componenets/onboarding/onboardingOptions";
import { cn } from "@/lib/utils";

export default function ExamDetailsStep() {
    const {
        examType,
        examLevel,
        examDate,
        hasExamDate,
        setExamType,
        setExamLevel,
        setExamDate,
        setHasExamDate,
    } = useOnboardingStore();

    return (
        <div>
            <StepHeader title="Which exam are you preparing for?" subtitle="This lets us tailor practice to your exam's format." />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {EXAM_TYPE_OPTIONS.map((opt) => {
                    const active = examType === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setExamType(opt.value)}
                            className={cn(
                                "rounded-2xl border p-4 text-center font-medium transition-all duration-200",
                                active
                                    ? "border-primary bg-primary/[0.06] text-primary"
                                    : "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lg text-foreground",
                            )}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            <h2 className="text-base font-semibold text-foreground mb-3">Which level are you preparing for?</h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
                {CEFR_LEVELS.map((level) => {
                    const active = examLevel === level.code;
                    return (
                        <button
                            key={level.code}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setExamLevel(level.code)}
                            className={cn(
                                "rounded-xl border py-3 text-center font-semibold transition-all duration-200",
                                active
                                    ? "border-primary bg-primary/[0.06] text-primary"
                                    : "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lg text-foreground",
                            )}
                        >
                            {level.code}
                        </button>
                    );
                })}
            </div>

            <h2 className="text-base font-semibold text-foreground mb-3">Do you have an exam date?</h2>
            <div className="space-y-3">
                <SelectionCard label="Not yet" active={!hasExamDate} onClick={() => setHasExamDate(false)} />
                <SelectionCard label="Yes" active={hasExamDate} onClick={() => setHasExamDate(true)} />
                {hasExamDate && (
                    <input
                        type="date"
                        value={examDate ?? ""}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                )}
            </div>
        </div>
    );
}
