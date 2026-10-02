import { Check } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

interface DailyWordsCompletionProps {
    total: number;
    onReview: () => void;
}

export default function DailyWordsCompletion({ total, onReview }: Readonly<DailyWordsCompletionProps>) {
    const { t } = useI18n();
    return (
        <div className="anim-fade-up overflow-hidden rounded-3xl bg-card text-center shadow-card">
            <div className="bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] px-6 py-8 text-white">
                <span className="text-4xl" aria-hidden="true">🎉</span>
                <h2 className="mt-2 text-2xl font-bold">{t.dailyWords.completion.title}</h2>
                <p className="mt-1 text-sm text-white/80">{t.dailyWords.completion.subtitle(total)}</p>
            </div>
            <div className="px-6 py-8">
                <div className="flex flex-wrap items-center justify-center gap-2" aria-hidden="true">
                    {Array.from({ length: total }).map((_, i) => (
                        <span key={i} className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-4" strokeWidth={3} />
                        </span>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onReview}
                    className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    {t.dailyWords.completion.review}
                </button>
            </div>
        </div>
    );
}
