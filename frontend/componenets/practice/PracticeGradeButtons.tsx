import { Check, X } from "lucide-react";

interface PracticeGradeButtonsProps {
    visible: boolean;
    disabled?: boolean;
    knowLabel: string;
    dontKnowLabel: string;
    onKnow: () => void;
    onDontKnow: () => void;
}

/** "I knew it" / "I didn't" pair. Reserved space and slides in once the card is flipped, so the layout never jumps. */
export default function PracticeGradeButtons({ visible, disabled, knowLabel, dontKnowLabel, onKnow, onDontKnow }: Readonly<PracticeGradeButtonsProps>) {
    return (
        <div
            aria-hidden={!visible}
            className={`mt-6 grid grid-cols-2 gap-3 transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
        >
            <button
                type="button"
                tabIndex={visible ? 0 : -1}
                disabled={disabled}
                onClick={onDontKnow}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60 dark:text-red-400"
            >
                <X className="size-4" aria-hidden="true" />
                {dontKnowLabel}
            </button>
            <button
                type="button"
                tabIndex={visible ? 0 : -1}
                disabled={disabled}
                onClick={onKnow}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-60 dark:text-green-400"
            >
                <Check className="size-4" aria-hidden="true" />
                {knowLabel}
            </button>
        </div>
    );
}
