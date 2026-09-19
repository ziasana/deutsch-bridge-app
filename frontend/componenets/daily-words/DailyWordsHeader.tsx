import LearningProgressBar from "@/componenets/learning/LearningProgressBar";

interface DailyWordsHeaderProps {
    learnedCount: number;
    total: number;
}

export default function DailyWordsHeader({ learnedCount, total }: DailyWordsHeaderProps) {
    const remaining = total - learnedCount;

    return (
        <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Words</h1>
            <p className="text-foreground/60 mt-1">Your {total} words for today</p>

            <div className="mt-5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground/80">
                    {learnedCount} / {total} learned
                </span>
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
                ariaLabel={`${learnedCount} of ${total} daily words learned`}
            />
            {remaining > 0 && (
                <p className="text-xs text-foreground/50 mt-2">
                    {remaining} word{remaining === 1 ? "" : "s"} remaining
                </p>
            )}
        </div>
    );
}
