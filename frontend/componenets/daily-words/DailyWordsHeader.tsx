import { useI18n } from "@/componenets/I18nProvider";

interface DailyWordsHeaderProps {
    learnedCount: number;
    total: number;
}

/** Gradient banner for today's words: title, how many are learned, one dot per word and a progress bar. */
export default function DailyWordsHeader({ learnedCount, total }: Readonly<DailyWordsHeaderProps>) {
    const { t } = useI18n();
    const remaining = total - learnedCount;
    const percent = total > 0 ? (learnedCount / total) * 100 : 0;

    return (
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] p-6 text-white shadow-card sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5" />

            <div className="relative">
                <h1 className="text-2xl font-bold sm:text-3xl">{t.dailyWords.title}</h1>
                <p className="mt-1 text-white/75">{t.dailyWords.subtitle(total)}</p>

                <div className="mt-6 flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">{t.dailyWords.header.learnedOf(learnedCount, total)}</span>
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        {Array.from({ length: total }).map((_, i) => (
                            <span key={i} className={`size-2.5 rounded-full transition-colors ${i < learnedCount ? "bg-white" : "bg-white/25"}`} />
                        ))}
                    </div>
                </div>
                <div
                    role="progressbar"
                    aria-valuenow={Math.round(percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t.dailyWords.header.progressAria(learnedCount, total)}
                    className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/20"
                >
                    <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
                {remaining > 0 && <p className="mt-2 text-xs text-white/70">{t.dailyWords.header.remaining(remaining)}</p>}
            </div>
        </section>
    );
}
