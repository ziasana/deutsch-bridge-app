import { Check } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";

interface DailyWordsOverviewProps {
    words: DailyWord[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

/** All of today's words as a grid of tappable tiles: ticked when learned, outlined when current. */
export default function DailyWordsOverview({ words, currentIndex, onSelect }: Readonly<DailyWordsOverviewProps>) {
    const { t } = useI18n();
    return (
        <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-foreground/70">{t.dailyWords.overview.title(words.length)}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {words.map((word, index) => {
                    const isCurrent = index === currentIndex;
                    const levelColor = getLevelMeta(word.level).color;

                    return (
                        <li key={word.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(index)}
                                aria-current={isCurrent ? "true" : undefined}
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    isCurrent ? "bg-card shadow-card ring-2 ring-primary/40" : "bg-foreground/[0.04] hover:bg-card",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                        word.learned ? "text-white" : isCurrent ? "bg-primary/10 text-primary" : "bg-foreground/10 text-foreground/45",
                                    )}
                                    style={word.learned ? { backgroundColor: levelColor } : undefined}
                                >
                                    {word.learned ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className={cn("block truncate text-sm font-semibold", isCurrent ? "text-primary" : "text-foreground")}>{word.word}</span>
                                    <span className="block text-xs font-medium" style={{ color: levelColor }}>
                                        {word.level}
                                    </span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
