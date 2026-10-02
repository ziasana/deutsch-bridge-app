import { Check } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

interface DailyWordsCompletionProps {
    total: number;
    onReview: () => void;
}

export default function DailyWordsCompletion({ total, onReview }: Readonly<DailyWordsCompletionProps>) {
    const { t } = useI18n();
    return (
        <div className="anim-fade-up rounded-3xl bg-card p-8 text-center shadow-card sm:p-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-7" strokeWidth={3} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-foreground">{t.dailyWords.completion.title}</h2>
            <p className="mt-1 text-foreground/60">{t.dailyWords.completion.subtitle(total)}</p>
            <button
                type="button"
                onClick={onReview}
                className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                {t.dailyWords.completion.review}
            </button>
        </div>
    );
}
