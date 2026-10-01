import { WritingAiFeedback as AiFeedback } from "@/types/writing";

function Block({ title, items }: { title: string; items: string[] }) {
    if (items.length === 0) return null;
    return (
        <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                {items.map((i) => (
                    <li key={i}>{i}</li>
                ))}
            </ul>
        </div>
    );
}

/** AI analysis of the learner's text. The AI never changes the task - it only comments on the answer. */
export default function WritingAiFeedback({ feedback }: { feedback: AiFeedback }) {
    return (
        <div className="space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">🤖 KI-Feedback</h3>
            <Block title="👍 Das ist gut gelungen" items={feedback.positives} />
            <Block title="❗ Fehlende oder schwache Punkte" items={feedback.missingPoints} />
            {feedback.grammar.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-foreground">✏️ Wichtigste Korrekturen</h4>
                    <ul className="mt-1 space-y-2">
                        {feedback.grammar.map((g) => (
                            <li key={g.original + g.corrected} className="rounded-lg bg-card px-3 py-2 text-sm shadow-card">
                                <span className="text-red-600 line-through dark:text-red-400">{g.original}</span>
                                <span aria-hidden> → </span>
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">{g.corrected}</span>
                                {g.explanation && <p className="mt-0.5 text-xs text-foreground/60">{g.explanation}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Block title="📚 Wortschatz" items={feedback.vocabulary} />
            <Block title="🧱 Aufbau & Stil" items={feedback.structure} />
            {feedback.improvementExample && (
                <div>
                    <h4 className="text-sm font-semibold text-foreground">💡 Beispiel zur Verbesserung</h4>
                    <p className="mt-1 rounded-lg bg-card px-3 py-2 text-sm text-foreground/85 shadow-card">{feedback.improvementExample}</p>
                </div>
            )}
            <p className="text-xs text-foreground/45">Von einer KI erstellt – kann Fehler enthalten. Prüfe die Hinweise kritisch.</p>
        </div>
    );
}
