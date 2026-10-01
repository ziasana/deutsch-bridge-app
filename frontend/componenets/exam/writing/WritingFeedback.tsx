import { AlertCircle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";
import { WritingFeedback as Feedback, WritingFeedbackStatus } from "@/types/writing";
import { cn } from "@/lib/utils";
import Expandable from "./Expandable";

const STATUS: Record<WritingFeedbackStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
    GOOD: { label: "Gut", icon: CheckCircle2, className: "text-emerald-600" },
    OK: { label: "Teilweise gut", icon: MinusCircle, className: "text-amber-500" },
    IMPROVE: { label: "Zum Verbessern", icon: AlertCircle, className: "text-orange-600" },
    NOT_ASSESSED: { label: "Selbst prüfen", icon: CircleDashed, className: "text-foreground/45" },
};

/** Feedback per dimension - what went well and what to improve, never one overall score. */
export default function WritingFeedback({ feedback }: { feedback: Feedback }) {
    return (
        <div className="space-y-4">
            {feedback.highlights.length > 0 && (
                <div className="rounded-xl bg-emerald-500/10 p-4">
                    <h3 className="text-sm font-semibold text-foreground">👍 Das hast du gut gemacht</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                        {feedback.highlights.map((h) => (
                            <li key={h}>{h}</li>
                        ))}
                    </ul>
                </div>
            )}

            {feedback.nextFocus.length > 0 && (
                <div className="rounded-xl bg-primary/10 p-4">
                    <h3 className="text-sm font-semibold text-foreground">🎯 Das solltest du als Nächstes verbessern</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                        {feedback.nextFocus.map((f) => (
                            <li key={f}>{f}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="space-y-2">
                {feedback.dimensions.map((d) => {
                    const meta = STATUS[d.status];
                    const Icon = meta.icon;
                    return (
                        <Expandable
                            key={d.key}
                            defaultOpen={d.status === "IMPROVE"}
                            title={
                                <span className="flex items-center gap-2">
                                    <Icon className={cn("size-4 shrink-0", meta.className)} aria-hidden />
                                    {d.title}
                                    <span className={cn("text-xs font-normal", meta.className)}>{meta.label}</span>
                                </span>
                            }
                        >
                            {d.positives.length > 0 && (
                                <ul className="space-y-1.5">
                                    {d.positives.map((p) => (
                                        <li key={p} className="flex gap-2">
                                            <span aria-hidden>✅</span>
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {d.improvements.length > 0 && (
                                <ul className={cn("space-y-1.5", d.positives.length > 0 && "mt-2")}>
                                    {d.improvements.map((p) => (
                                        <li key={p} className="flex gap-2">
                                            <span aria-hidden>{d.status === "NOT_ASSESSED" ? "🔍" : "💡"}</span>
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Expandable>
                    );
                })}
            </div>

            <p className="text-xs text-foreground/45">
                {feedback.source === "RULES"
                    ? "Automatische Analyse nach festen Regeln – sie ersetzt keine Korrektur durch eine Lehrkraft."
                    : "Feedback automatisch erstellt."}
            </p>
        </div>
    );
}
