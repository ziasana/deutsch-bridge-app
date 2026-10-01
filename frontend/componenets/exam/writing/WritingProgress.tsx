import Link from "next/link";
import { WritingProgress as Progress } from "@/types/writing";

/** Which dimension to practise and where to learn about it. */
const ISSUE_HINTS: Record<string, string> = {
    TASK: "Achte darauf, alle Leitpunkte zu beantworten und genug zu schreiben.",
    STRUCTURE: "Übe Anrede, Schluss, Absätze und Verbindungswörter.",
    VOCABULARY: "Nutze mehr Redemittel und variiere deine Wörter.",
    FORM: "Kontrolliere Groß-/Kleinschreibung und Satzzeichen.",
};

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-card p-4 text-center shadow-card">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="mt-0.5 text-xs text-foreground/55">{label}</div>
        </div>
    );
}

/** "Mein Schreibfortschritt": what the learner did and what to work on - not a list of scores. */
export default function WritingProgress({ progress, level }: { progress: Progress; level: string }) {
    if (progress.attemptsCount === 0) {
        return (
            <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">
                Du hast noch keinen Text abgegeben. Sobald du eine Schreibaufgabe abgibst, siehst du hier deinen Fortschritt.
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Texte geschrieben" value={progress.attemptsCount} />
                <Stat label="Aufgaben bearbeitet" value={progress.exercisesWritten} />
                <Stat label="Texte überarbeitet" value={progress.revisedTexts} />
                <Stat label="Wörter insgesamt" value={progress.totalWords} />
            </div>

            <section className="rounded-[10px] bg-card p-5 shadow-card">
                <h2 className="font-semibold text-foreground">🎯 Dein aktueller Fokus</h2>
                {progress.topIssues.length === 0 ? (
                    <p className="mt-2 text-sm text-foreground/60">In deinen letzten Texten gab es keine wiederkehrenden Probleme. Weiter so!</p>
                ) : (
                    <ol className="mt-3 space-y-3">
                        {progress.topIssues.map((issue, i) => (
                            <li key={issue.key} className="flex gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {issue.title} <span className="text-xs font-normal text-foreground/50">({issue.count}× in den letzten Texten)</span>
                                    </p>
                                    <p className="text-sm text-foreground/60">{ISSUE_HINTS[issue.key]}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
                <Link href={`/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(level)}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                    Im Lernbereich nachlesen →
                </Link>
            </section>

            {progress.recentGrammarFixes.length > 0 && (
                <section className="rounded-[10px] bg-card p-5 shadow-card">
                    <h2 className="font-semibold text-foreground">✏️ Zuletzt korrigiert (KI-Feedback)</h2>
                    <ul className="mt-3 space-y-2">
                        {progress.recentGrammarFixes.map((g) => (
                            <li key={g.original + g.corrected} className="rounded-lg bg-accent/40 px-3 py-2 text-sm">
                                <span className="text-red-600 line-through dark:text-red-400">{g.original}</span> →{" "}
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">{g.corrected}</span>
                                {g.explanation && <p className="mt-0.5 text-xs text-foreground/60">{g.explanation}</p>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
