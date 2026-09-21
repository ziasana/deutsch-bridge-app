import { CheckCircle2, Circle } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";

interface DailyWordsOverviewProps {
    words: DailyWord[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

export default function DailyWordsOverview({ words, currentIndex, onSelect }: DailyWordsOverviewProps) {
    const { t } = useI18n();
    return (
        <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground/70 mb-2">{t.dailyWords.overview.title(words.length)}</h2>
            <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
                {words.map((word, index) => {
                    const isCurrent = index === currentIndex;
                    const levelColor = getLevelMeta(word.level).color;

                    return (
                        <button
                            key={word.id}
                            type="button"
                            onClick={() => onSelect(index)}
                            aria-current={isCurrent ? "true" : undefined}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/40 last:border-b-0 hover:bg-accent/40",
                                isCurrent && "bg-primary/[0.06]",
                            )}
                        >
                            {word.learned ? (
                                <CheckCircle2 className="size-5 shrink-0" style={{ color: levelColor }} strokeWidth={2.5} />
                            ) : isCurrent ? (
                                <span className="flex size-5 shrink-0 items-center justify-center">
                                    <span className="size-2.5 rounded-full bg-primary" />
                                </span>
                            ) : (
                                <Circle className="size-5 shrink-0 text-foreground/25" />
                            )}
                            <span
                                className={cn(
                                    "flex-1 truncate font-medium",
                                    isCurrent ? "text-primary" : "text-foreground",
                                )}
                            >
                                {word.word}
                            </span>
                            <span
                                className="rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
                                style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
                            >
                                {word.level}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
