import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { useI18n } from "@/componenets/I18nProvider";

interface DailyWordsHeaderProps {
    learnedCount: number;
    total: number;
}

export default function DailyWordsHeader({ learnedCount, total }: DailyWordsHeaderProps) {
    const { t } = useI18n();
    const remaining = total - learnedCount;

    return (
        <div>
            <h1 className="text-3xl font-bold text-foreground">{t.dailyWords.title}</h1>
            <p className="text-foreground/60 mt-1">{t.dailyWords.subtitle(total)}</p>

            <div className="mt-5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground/80">{t.dailyWords.header.learnedOf(learnedCount, total)}</span>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                    {Array.from({ length: total }).map((_, i) => (
                        <span
                            key={i}
                            className={`size-2 rounded-full ${i < learnedCount ? "bg-primary" : "bg-foreground/15"}`}
                        />
                    ))}
                </div>
            </div>
            <LearningProgressBar
                value={total > 0 ? (learnedCount / total) * 100 : 0}
                className="mt-2"
                ariaLabel={t.dailyWords.header.progressAria(learnedCount, total)}
            />
            {remaining > 0 && (
                <p className="text-xs text-foreground/50 mt-2">{t.dailyWords.header.remaining(remaining)}</p>
            )}
        </div>
    );
}
