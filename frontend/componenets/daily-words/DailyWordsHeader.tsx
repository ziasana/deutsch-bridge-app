import { Check, SpellCheck } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { useI18n } from "@/componenets/I18nProvider";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import { cn } from "@/lib/utils";

interface DailyWordsHeaderProps {
    words: DailyWord[];
    /** Index of the word being studied, or -1 when none is (practice / completion). */
    currentIndex: number;
    /** Jump to a word when its step is tapped; omit to make the steps read-only. */
    onSelect?: (index: number) => void;
}

/**
 * A soft, tinted hero: title and a big "x / y" count, with today's words laid out as a journey underneath.
 * Light on purpose, so the word card right below stays the focus of the page.
 */
export default function DailyWordsHeader({ words, currentIndex, onSelect }: Readonly<DailyWordsHeaderProps>) {
    const { t } = useI18n();
    const total = words.length;
    const learnedCount = words.filter((w) => w.learned).length;

    return (
        <header className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-card p-5 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/[0.06]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-1/4 size-36 rounded-full bg-primary/[0.04]" />

            <div className="relative flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <SpellCheck className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">{t.dailyWords.title}</h1>
                            <CurrentLevelChip />
                        </div>
                        <p className="truncate text-sm text-foreground/60">{t.dailyWords.subtitle(total)}</p>
                    </div>
                </div>

                <div className="shrink-0 text-right" aria-label={t.dailyWords.header.learnedOf(learnedCount, total)}>
                    <p className="text-3xl font-bold leading-none text-primary sm:text-4xl">
                        {learnedCount}
                        <span className="text-xl font-semibold text-foreground/35 sm:text-2xl"> / {total}</span>
                    </p>
                </div>
            </div>

            <ol
                role="progressbar"
                aria-valuenow={learnedCount}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={t.dailyWords.header.progressAria(learnedCount, total)}
                className="relative mt-6 grid"
                style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
            >
                {words.map((word, i) => {
                    const isCurrent = i === currentIndex;
                    const stepClass = cn(
                        "relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-bold transition",
                        word.learned && "bg-primary text-primary-foreground shadow-sm",
                        !word.learned && isCurrent && "border-2 border-primary bg-card text-primary shadow-sm",
                        !word.learned && !isCurrent && "border border-border bg-card text-foreground/40",
                    );
                    const content = word.learned ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : i + 1;
                    return (
                        <li key={word.id} className="relative flex flex-col items-center gap-2 px-0.5">
                            {i > 0 && <span aria-hidden="true" className={cn("absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 transition-colors duration-500", words[i - 1].learned ? "bg-primary" : "bg-foreground/15")} />}
                            {i < total - 1 && <span aria-hidden="true" className={cn("absolute left-1/2 right-0 top-4 h-0.5 -translate-y-1/2 transition-colors duration-500", word.learned ? "bg-primary" : "bg-foreground/15")} />}

                            {onSelect ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(i)}
                                    aria-current={isCurrent ? "step" : undefined}
                                    aria-label={word.word}
                                    className={cn(stepClass, "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50")}
                                >
                                    {content}
                                </button>
                            ) : (
                                <span className={stepClass}>{content}</span>
                            )}
                            <span className={cn("w-full truncate text-center text-xs", isCurrent ? "font-semibold text-primary" : word.learned ? "text-foreground/70" : "text-foreground/45")}>
                                {word.word}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </header>
    );
}
