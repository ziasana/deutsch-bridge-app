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
        <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-10 flex items-start justify-center">
            <div className="w-full max-w-xl">
                {banner && <div className="mb-4">{banner}</div>}

                <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">DeutschBridge</span>
                    <span className="text-sm text-foreground/50">
                        Step {stepIndex + 1} of {totalSteps}
                    </span>
                </div>

                <OnboardingProgress stepIndex={stepIndex} totalSteps={totalSteps} className="mb-8" />

                <div className="bg-card rounded-2xl shadow-card border border-border/60 p-6 sm:p-8">
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
                            className="gap-1.5"
                        >
                            {continueLoading ? "Saving..." : continueLabel}
                            {!continueLoading && <ArrowRight className="size-4" />}
                        </Button>
                    </div>
                </div>

                {footer && <div className="mt-4 text-center">{footer}</div>}
            </div>
        </div>
    );
}
