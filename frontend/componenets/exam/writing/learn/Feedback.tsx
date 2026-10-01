import { cn } from "@/lib/utils";

interface FeedbackProps {
    correct: boolean;
    message: string;
    explanation?: string | null;
}

/** Immediate reaction after an answer. role=status so screen readers announce it. */
export default function Feedback({ correct, message, explanation }: FeedbackProps) {
    return (
        <div
            role="status"
            className={cn(
                "anim-pop rounded-xl px-4 py-3 text-sm",
                correct ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300" : "bg-orange-500/12 text-orange-800 dark:text-orange-300",
            )}
        >
            <p className="font-semibold">{message}</p>
            {explanation && <p className="mt-1 text-foreground/75">{explanation}</p>}
        </div>
    );
}
