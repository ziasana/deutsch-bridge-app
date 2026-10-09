import { PartyPopper } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

interface DailyWordsCompletionProps {
    total: number;
    onReview: () => void;
}

export default function DailyWordsCompletion({ total, onReview }: Readonly<DailyWordsCompletionProps>) {
    const { t } = useI18n();
    return (
        <div className="anim-fade-up overflow-hidden rounded-3xl bg-card text-center shadow-card ring-1 ring-border/60">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-6 py-9 text-white">
                <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                <span className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-white/25">
                    <PartyPopper className="anim-pop size-8" aria-hidden="true" />
                </span>
                <h2 className="relative mt-4 text-2xl font-extrabold">{t.dailyWords.completion.title}</h2>
                <p className="relative mt-1 text-white/90">{t.dailyWords.completion.subtitle(total)}</p>
            </div>
            <div className="p-6 sm:p-8">
                <button
                    type="button"
                    onClick={onReview}
                    className="inline-flex cursor-pointer items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    {t.dailyWords.completion.review}
                </button>
            </div>
        </div>
    );
}
