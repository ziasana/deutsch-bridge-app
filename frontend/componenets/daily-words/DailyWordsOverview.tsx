import { Check, ChevronRight } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";

interface DailyWordsOverviewProps {
    words: DailyWord[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

/** Today's words as one white panel with a heading and divided rows: ticked when learned, accented when current. */
export default function DailyWordsOverview({ words, currentIndex, onSelect }: Readonly<DailyWordsOverviewProps>) {
    const { t } = useI18n();
    const learnedCount = words.filter((w) => w.learned).length;

    return (
        <section aria-label={t.dailyWords.overview.title(words.length)} className="overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
                <h2 className="text-base font-semibold text-foreground">{t.dailyWords.overview.title(words.length)}</h2>
                <span className="text-xs font-medium text-foreground/50">{learnedCount} / {words.length}</span>
            </div>
            <ul className="divide-y divide-border/60 border-t border-border/60">
                {words.map((word, index) => {
                    const isCurrent = index === currentIndex;

                    return (
                        <li key={word.id} className="relative">
                            {isCurrent && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />}
                            <button
                                type="button"
                                onClick={() => onSelect(index)}
                                aria-current={isCurrent ? "true" : undefined}
                                className={cn(
                                    "group flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 sm:px-6",
                                    isCurrent && "bg-primary/[0.05]",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
                                        word.learned && "bg-primary text-primary-foreground",
                                        !word.learned && isCurrent && "border-2 border-primary text-primary",
                                        !word.learned && !isCurrent && "bg-foreground/[0.06] text-foreground/45",
                                    )}
                                >
                                    {word.learned ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
                                </span>
                                <span className={cn("min-w-0 flex-1 truncate text-base font-medium", isCurrent ? "text-primary" : "text-foreground")}>{word.word}</span>
                                <span className="hidden max-w-[45%] shrink-0 truncate text-right text-sm text-foreground/60 sm:block" title={word.meaning}>
                                    {word.meaning}
                                </span>
                                <ChevronRight className={cn("size-4 shrink-0 transition", isCurrent ? "text-primary" : "text-foreground/25 group-hover:translate-x-0.5 group-hover:text-foreground/50")} aria-hidden="true" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
