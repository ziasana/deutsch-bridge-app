import { Check, SpellCheck } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { useI18n } from "@/componenets/I18nProvider";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { cn } from "@/lib/utils";
import { DAILY_WORDS_ACCENT } from "./dailyWordsAccent";

interface DailyWordsHeaderProps {
    words: DailyWord[];
    /** Index of the word being studied, or -1 when none is (practice / completion). */
    currentIndex: number;
    /** Jump to a word when its step is tapped; omit to make the steps read-only. */
    onSelect?: (index: number) => void;
}

/**
 * The shared navy learning header: title and a big "x / y" count, with today's words laid out as a journey underneath
 * (learned = teal, current = bright blue ring).
 */
export default function DailyWordsHeader({ words, currentIndex, onSelect }: Readonly<DailyWordsHeaderProps>) {
    const { t } = useI18n();
    const total = words.length;
    const learnedCount = words.filter((w) => w.learned).length;

    return (
        <LearningPageHero
            icon={SpellCheck}
            title={t.dailyWords.title}
            subtitle={t.dailyWords.subtitle(total)}
            meta={<CurrentLevelChip />}
            accent={DAILY_WORDS_ACCENT}
            actions={
                <div className="text-right" aria-label={t.dailyWords.header.learnedOf(learnedCount, total)}>
                    <p className="rounded-2xl bg-white/[0.08] px-4 py-2 text-3xl font-extrabold leading-none text-[#f2b544] ring-1 ring-white/10 sm:text-4xl">
                        {learnedCount}
                        <span className="text-xl font-semibold text-[#b9c7d6] sm:text-2xl"> / {total}</span>
                    </p>
                </div>
            }
        >
            <ol
                role="progressbar"
                aria-valuenow={learnedCount}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={t.dailyWords.header.progressAria(learnedCount, total)}
                className="grid"
                style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
            >
                {words.map((word, i) => {
                    const isCurrent = i === currentIndex;
                    const stepClass = cn(
                        "relative z-10 flex size-9 items-center justify-center rounded-full text-sm font-bold transition",
                        word.learned && "bg-[#527c91] text-white shadow-sm",
                        !word.learned && isCurrent && "border-2 border-[#3d8bff] bg-[#16324f] text-white ring-4 ring-[#3d8bff]/25",
                        !word.learned && !isCurrent && "border border-white/20 bg-white/[0.06] text-[#b9c7d6]",
                    );
                    const content = word.learned ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : i + 1;
                    return (
                        <li key={word.id} className="relative flex flex-col items-center gap-2 px-0.5">
                            {i > 0 && <span aria-hidden="true" className={cn("absolute left-0 right-1/2 top-[18px] h-0.5 -translate-y-1/2 transition-colors duration-500", words[i - 1].learned ? "bg-[#527c91]" : "bg-white/15")} />}
                            {i < total - 1 && <span aria-hidden="true" className={cn("absolute left-1/2 right-0 top-[18px] h-0.5 -translate-y-1/2 transition-colors duration-500", word.learned ? "bg-[#527c91]" : "bg-white/15")} />}

                            {onSelect ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(i)}
                                    aria-current={isCurrent ? "step" : undefined}
                                    aria-label={word.word}
                                    className={cn(stepClass, "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white")}
                                >
                                    {content}
                                </button>
                            ) : (
                                <span className={stepClass}>{content}</span>
                            )}
                            <span className={cn("w-full truncate text-center text-xs", isCurrent ? "font-semibold text-white" : word.learned ? "text-[#dbe6f0]" : "text-[#b9c7d6]")}>
                                {word.word}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </LearningPageHero>
    );
}
