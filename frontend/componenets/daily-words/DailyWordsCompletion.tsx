import Button from "@/componenets/Button";
import { useI18n } from "@/componenets/I18nProvider";

interface DailyWordsCompletionProps {
    total: number;
    onReview: () => void;
}

export default function DailyWordsCompletion({ total, onReview }: DailyWordsCompletionProps) {
    const { t } = useI18n();
    return (
        <div className="rounded-2xl border border-border/60 bg-card p-8 sm:p-10 shadow-card text-center">
            <span className="text-4xl" aria-hidden="true">🎉</span>
            <h2 className="mt-3 text-2xl font-bold text-foreground">{t.dailyWords.completion.title}</h2>
            <p className="mt-1 text-foreground/60">{t.dailyWords.completion.subtitle(total)}</p>

            <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
                {Array.from({ length: total }).map((_, i) => (
                    <span key={i} className="size-2.5 rounded-full bg-primary" />
                ))}
            </div>

            <Button variant="secondary" className="mt-6 text-sm" onClick={onReview}>
                {t.dailyWords.completion.review}
            </Button>
        </div>
    );
}
