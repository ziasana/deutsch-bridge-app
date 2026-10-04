"use client";

import { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/componenets/ui/button";
import OnboardingProgress from "@/componenets/onboarding/OnboardingProgress";

interface OnboardingLayoutProps {
    stepIndex: number; // 0-based
    totalSteps: number;
    onBack?: () => void;
    onContinue: () => void;
    continueDisabled?: boolean;
    continueLabel?: string;
    continueLoading?: boolean;
    banner?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}

export default function OnboardingLayout({
    stepIndex,
    totalSteps,
    onBack,
    onContinue,
    continueDisabled,
    continueLabel = "Continue",
    continueLoading,
    banner,
    footer,
    children,
}: OnboardingLayoutProps) {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-10 sm:px-6">
            <div className="mx-auto w-full max-w-2xl">
                {banner && <div className="mb-4">{banner}</div>}

                <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">DeutschBridge</span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Step {stepIndex + 1} of {totalSteps}
                    </span>
                </div>

                <OnboardingProgress stepIndex={stepIndex} totalSteps={totalSteps} className="mb-6" />

                {children}

                <div className="mt-8 flex items-center justify-between gap-3">
                    {onBack ? (
                        <Button type="button" variant="ghost" onClick={onBack} className="gap-1.5">
                            <ArrowLeft className="size-4" />
                            Back
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button
                        type="button"
                        onClick={onContinue}
                        disabled={continueDisabled || continueLoading}
                        className="gap-1.5 rounded-full px-6"
                    >
                        {continueLoading ? "Saving..." : continueLabel}
                        {!continueLoading && <ArrowRight className="size-4" />}
                    </Button>
                </div>

                {footer && <div className="mt-4 text-center">{footer}</div>}
            </div>
        </div>
    );
}
