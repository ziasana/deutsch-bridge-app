"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import useOnboardingStore, { BASE_STEPS, OnboardingStepId } from "@/store/useOnboardingStore";
import useAuthStore from "@/store/useAuthStore";
import { completeOnboarding } from "@/services/userService";
import { toast } from "@/lib/toast";
import OnboardingLayout from "@/componenets/onboarding/OnboardingLayout";
import OnboardingComplete from "@/componenets/onboarding/OnboardingComplete";
import ExplanationLanguageStep from "@/componenets/onboarding/ExplanationLanguageStep";
import LearningReasonStep from "@/componenets/onboarding/LearningReasonStep";
import CurrentLevelStep from "@/componenets/onboarding/CurrentLevelStep";
import TargetLevelStep from "@/componenets/onboarding/TargetLevelStep";
import DailyWordsStep from "@/componenets/onboarding/DailyWordsStep";
import FocusAreasStep from "@/componenets/onboarding/FocusAreasStep";
import ExamDetailsStep from "@/componenets/onboarding/ExamDetailsStep";
import { OnboardingRequest } from "@/types/onboarding";

const STEP_COMPONENTS: Record<OnboardingStepId, React.ComponentType> = {
    language: ExplanationLanguageStep,
    reason: LearningReasonStep,
    currentLevel: CurrentLevelStep,
    targetLevel: TargetLevelStep,
    dailyWords: DailyWordsStep,
    focus: FocusAreasStep,
    exam: ExamDetailsStep,
};

export default function SignupOnboardingPage() {
    const router = useRouter();
    const { isLoggedIn, hasHydrated, userProfile, updateUserProfile } = useAuthStore();
    const state = useOnboardingStore();
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    // This step only makes sense for an authenticated account with an incomplete profile.
    // An anonymous visitor goes back to /signup to create one; someone who already finished
    // their learning profile (this session or a prior one) has nothing left to do here.
    useEffect(() => {
        if (!hasHydrated) return;
        if (!isLoggedIn) {
            router.replace("/signup");
            return;
        }
        if (completed) return;
        if (userProfile?.onboardingCompleted) {
            router.replace("/dashboard");
        }
    }, [hasHydrated, isLoggedIn, userProfile, completed, router]);

    // The wizard's answers persist to localStorage so a mid-flow refresh resumes where the
    // learner left off, but that storage isn't scoped to an account — without this, a brand-new
    // signup (or a different account logging in on the same browser) would inherit whatever
    // step/answers a previous account left behind. Reset it the moment the logged-in email
    // doesn't match whoever the stored answers belong to.
    useEffect(() => {
        if (!hasHydrated || !isLoggedIn) return;
        state.ensureOwner(userProfile?.email);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasHydrated, isLoggedIn, userProfile?.email]);

    const isOwnerConfirmed = state.ownerEmail === (userProfile?.email ?? null);

    const steps = useMemo<OnboardingStepId[]>(() => {
        return state.learningReasons.includes("EXAM") ? [...BASE_STEPS, "exam"] : BASE_STEPS;
    }, [state.learningReasons]);

    const stepIndex = Math.max(0, steps.indexOf(state.currentStepId));

    // Keep the step pointer valid if the exam step disappears (e.g. user unselects "Exam Preparation").
    useEffect(() => {
        if (!steps.includes(state.currentStepId)) {
            state.setStep(steps[steps.length - 1]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [steps]);

    const isValid = useMemo(() => {
        switch (state.currentStepId) {
            case "language":
                return !!state.explanationLanguage;
            case "reason":
                return state.learningReasons.length >= 1;
            case "currentLevel":
                return !!state.currentLevel || state.currentLevelUnknown;
            case "targetLevel":
                return !!state.targetLevel;
            case "dailyWords":
                return !!state.dailyGoalWords;
            case "focus":
                return state.focusAreas.length >= 1 && state.focusAreas.length <= 3;
            case "exam":
                return !!state.examType && !!state.examLevel;
            default:
                return false;
        }
    }, [state]);

    const StepComponent = STEP_COMPONENTS[state.currentStepId];

    const handleBack = () => {
        if (stepIndex === 0) return;
        state.setStep(steps[stepIndex - 1]);
    };

    const handleContinue = async () => {
        if (!isValid) return;

        if (stepIndex < steps.length - 1) {
            state.setStep(steps[stepIndex + 1]);
            return;
        }

        const payload: OnboardingRequest = {
            preferredLanguage: state.explanationLanguage!,
            learningReasons: state.learningReasons,
            currentLevel: state.currentLevelUnknown ? null : state.currentLevel ?? null,
            currentLevelUnknown: state.currentLevelUnknown,
            targetLevel: state.targetLevel!,
            dailyGoalWords: state.dailyGoalWords!,
            focusAreas: state.focusAreas,
            examType: state.learningReasons.includes("EXAM") ? state.examType ?? null : null,
            examLevel: state.learningReasons.includes("EXAM") ? state.examLevel ?? null : null,
            examDate: state.learningReasons.includes("EXAM") && state.hasExamDate ? state.examDate ?? null : null,
        };

        setSubmitting(true);
        try {
            const res = await completeOnboarding(payload);
            // Only flip onboardingCompleted locally once the save has actually succeeded — if this
            // request fails, the account must stay in "incomplete" state so a re-login resumes here
            // instead of silently treating a half-finished setup as done.
            updateUserProfile(res.data.data);
            setCompleted(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't save your learning plan. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasHydrated || !isLoggedIn || !isOwnerConfirmed) return null;

    if (completed) {
        return (
            <OnboardingComplete
                targetLevel={state.targetLevel ?? ""}
                focusAreas={state.focusAreas}
                dailyGoalWords={state.dailyGoalWords ?? 5}
                onStart={() => {
                    state.reset();
                    router.push("/dashboard");
                }}
            />
        );
    }

    return (
        <OnboardingLayout
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onBack={stepIndex > 0 ? handleBack : undefined}
            onContinue={handleContinue}
            continueDisabled={!isValid}
            continueLoading={submitting}
            continueLabel={stepIndex === steps.length - 1 ? "Finish" : "Continue"}
            banner={
                stepIndex === 0 ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <CheckCircle2 className="size-4" />
                        Account created — let&apos;s personalize your German learning.
                    </div>
                ) : undefined
            }
        >
            <StepComponent />
        </OnboardingLayout>
    );
}
