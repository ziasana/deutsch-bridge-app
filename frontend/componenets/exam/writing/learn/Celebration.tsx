import { cn } from "@/lib/utils";
import { LessonAccent } from "../../lessonTheme";

const PARTICLES = ["🎉", "⭐", "✨", "🎊", "💫", "🌟", "✨", "🎉"];

interface CelebrationProps {
    correct: number;
    total: number;
    stationLabel: string;
    nextLabel: string | null;
    onNext: () => void;
    onRepeat: () => void;
    onOverview: () => void;
    /** Text of the final button when there is no next station. */
    finishLabel?: string;
    accent?: LessonAccent;
}

/** End-of-lesson reaction: stars, a short message based on the quiz result, and clear next actions. */
export default function Celebration({ correct, total, stationLabel, nextLabel, onNext, onRepeat, onOverview, finishLabel = "Jetzt Schreibaufgaben üben →", accent }: CelebrationProps) {
    const speaking = !!accent;
    const ratio = total === 0 ? 1 : correct / total;
    const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    const message = stars === 3 ? "Ausgezeichnet!" : stars === 2 ? "Gut gemacht!" : "Geschafft – Übung macht den Meister!";

    return (
        <div className={cn("relative mx-auto flex max-w-md flex-col items-center py-10 text-center", speaking && "my-6 rounded-3xl bg-card px-6 shadow-card ring-1 ring-primary/15")}>
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-16">
                {PARTICLES.map((p, i) => {
                    const angle = (i / PARTICLES.length) * Math.PI * 2;
                    return (
                        <span
                            key={i}
                            className="anim-burst absolute text-xl"
                            style={{ ["--bx" as string]: `${Math.cos(angle) * 110}px`, ["--by" as string]: `${Math.sin(angle) * 90}px` }}
                        >
                            {p}
                        </span>
                    );
                })}
            </div>

            <div className="anim-pop flex gap-1 text-5xl" role="img" aria-label={`${stars} von 3 Sternen`}>
                {[1, 2, 3].map((n) => (
                    <span key={n} className={cn(n <= stars ? "" : "opacity-20 grayscale")}>⭐</span>
                ))}
            </div>
            <h2 className="mt-5 text-2xl font-bold text-foreground">{message}</h2>
            <p className="mt-1 text-sm text-foreground/60">Du hast „{stationLabel}“ abgeschlossen.</p>
            {total > 0 && (
                <p className="mt-4 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-foreground/80">
                    {correct} von {total} Fragen gleich richtig
                </p>
            )}

            <div className="mt-8 flex w-full flex-col gap-2">
                <button type="button" onClick={onNext} className={cn("min-h-12 cursor-pointer rounded-full px-6 text-sm font-semibold text-primary-foreground transition", speaking ? "bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg" : "bg-primary hover:bg-primary/90")}>
                    {nextLabel ? `Weiter: ${nextLabel} →` : finishLabel}
                </button>
                <button type="button" onClick={onRepeat} className="min-h-11 rounded-full border border-border px-6 text-sm font-medium transition hover:bg-accent cursor-pointer">
                    Noch einmal
                </button>
                <button type="button" onClick={onOverview} className="min-h-11 rounded-full px-6 text-sm font-medium text-foreground/60 transition hover:text-foreground cursor-pointer">
                    Zur Übersicht
                </button>
            </div>
        </div>
    );
}
