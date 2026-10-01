import { WritingFeedback } from "@/types/writing";

interface Props {
    feedback: WritingFeedback | null;
    onRevise: () => void;
}

/** "Verbessere deinen Text": the focus for the next attempt, taken from the feedback. */
export default function WritingRevision({ feedback, onRevise }: Props) {
    const focus = feedback?.nextFocus ?? [];
    return (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <h3 className="text-sm font-semibold text-foreground">🎯 Verbessere deinen Text</h3>
            {focus.length > 0 ? (
                <>
                    <p className="mt-1 text-sm text-foreground/70">Achte beim nächsten Versuch besonders auf:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                        {focus.map((f) => (
                            <li key={f}>{f}</li>
                        ))}
                    </ul>
                </>
            ) : (
                <p className="mt-1 text-sm text-foreground/70">Du kannst deinen Text noch einmal lesen und verfeinern.</p>
            )}
            <button
                type="button"
                onClick={onRevise}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
                Text überarbeiten
            </button>
        </div>
    );
}
