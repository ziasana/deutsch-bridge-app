import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";
import { resolveUploadUrl } from "@/lib/backendOrigin";

/**
 * Presentational pieces of Mündlicher Ausdruck, in three layers:
 *  - {@link SpeakingStimulus}: the task itself (always visible),
 *  - the help panels ({@link SpeakingTipsPanel}, {@link SpeakingPhrasesPanel}, {@link SpeakingMistakesPanel}): the Lernbereich content that fits this exercise, shown in the help drawer,
 *  - {@link SpeakingModel}: the exercise's own example answers (revealed on request).
 * {@link GuideLearnView} renders the whole Lernbereich of a Teil. All text is German.
 */

const card = "rounded-[10px] bg-card p-5 shadow-card sm:p-6";
const heading = "text-sm font-semibold text-foreground";
const list = "mt-2 list-disc space-y-1 ps-5 text-sm text-foreground/80";

export function PhraseList({ phrases }: Readonly<{ phrases: string[] }>) {
    if (phrases.length === 0) return null;
    return (
        <ul className="mt-2 flex flex-wrap gap-2">
            {phrases.map((phrase) => (
                <li key={phrase} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {phrase}
                </li>
            ))}
        </ul>
    );
}

function Tip({ text }: Readonly<{ text?: string | null }>) {
    if (!text) return null;
    return <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-foreground/80">💡 {text}</p>;
}

/** The task: what the learner has to talk about. Never hidden. `guide` supplies the four fixed goals of Teil 2. */
export function SpeakingStimulus({ content, guide }: Readonly<{ content: SpeakingContent; guide?: SpeakingGuideContent | null }>) {
    if (content.taskType === "TOPIC_INTERVIEW") {
        return (
            <section className={card} aria-label="Aufgabe">
                <h2 className={heading}>Themen</h2>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(content.topics ?? []).map((topic) => (
                        <li key={topic.id} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground/90">
                            {topic.title}
                        </li>
                    ))}
                </ul>
            </section>
        );
    }

    if (content.taskType === "OPINION_DISCUSSION") {
        const person = content.person;
        const image = resolveUploadUrl(person?.image ?? null);
        return (
            <section className={card} aria-label="Aufgabe">
                <h2 className={heading}>{content.topic}</h2>
                <div className="mt-3 flex items-start gap-4">
                    {image && <img src={image} alt={person?.imageAlt ?? ""} className="size-20 shrink-0 rounded-lg object-cover" />}
                    <div className="min-w-0">
                        {person && (
                            <p className="text-sm font-semibold text-foreground">
                                {person.name}, {person.age} Jahre, {person.occupation}
                            </p>
                        )}
                        <blockquote className="mt-2 whitespace-pre-line border-s-4 border-primary/40 ps-3 text-sm text-foreground/85">
                            {content.opinionText}
                        </blockquote>
                    </div>
                </div>
                {(guide?.goals ?? []).length > 0 && (
                    <>
                        <h3 className={`${heading} mt-4`}>Ihre Aufgaben</h3>
                        <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm text-foreground/85">
                            {(guide?.goals ?? []).map((goal) => (
                                <li key={goal.id}>{goal.description}</li>
                            ))}
                        </ol>
                    </>
                )}
            </section>
        );
    }

    const sceneImage = resolveUploadUrl(content.image ?? null);
    return (
        <section className={card} aria-label="Aufgabe">
            <h2 className={heading}>{content.topic}</h2>
            {sceneImage && <img src={sceneImage} alt={content.imageAlt ?? ""} className="mt-3 max-h-64 w-full rounded-lg object-cover" />}
            <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">{content.scenario}</p>
            <h3 className={`${heading} mt-4`}>Besprechen Sie:</h3>
            <ul className={list}>
                {(content.planningPoints ?? []).map((point) => (
                    <li key={point.id}>
                        {point.title}
                        {point.hint && <span className="text-foreground/55"> – {point.hint}</span>}
                    </li>
                ))}
            </ul>
        </section>
    );
}

interface HelpProps {
    content: SpeakingContent;
    guide?: SpeakingGuideContent | null;
}

/** Tab "Tipps": the Lernbereich's tips and, when present, the exercise's own preparation notes. */
export function SpeakingTipsPanel({ content, guide }: Readonly<HelpProps>) {
    const notes = content.preparationNotes ?? [];
    const tips = guide?.tips ?? [];
    if (notes.length === 0 && tips.length === 0) return <p className="text-sm text-foreground/55">Hier gibt es noch keine Tipps.</p>;
    return (
        <div className="space-y-4">
            {notes.length > 0 && (
                <div>
                    <h3 className={heading}>Vorbereitung</h3>
                    <ul className={list}>{notes.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
            )}
            {tips.length > 0 && (
                <ul className="space-y-3 text-sm text-foreground/85">
                    {tips.map((tip) => (
                        <li key={tip.title} className="rounded-xl bg-accent/50 p-3">
                            <span className="font-semibold">💡 {tip.title}.</span> {tip.text}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * Tab "Redemittel": the Lernbereich's questions and phrases that fit THIS exercise (its own topics / goals / functions),
 * plus the exercise's own extra phrases. Everything is shown in place - no navigation away from the exercise.
 */
export function SpeakingPhrasesPanel({ content, guide }: Readonly<HelpProps>) {
    if (content.taskType === "TOPIC_INTERVIEW") {
        const topics = (content.topics ?? []).map((t) => guide?.topics?.find((g) => g.id === t.id)).filter((g): g is NonNullable<typeof g> => !!g);
        if (topics.length === 0) return <p className="text-sm text-foreground/55">Hier gibt es noch keine Redemittel.</p>;
        return (
            <div className="space-y-3">
                {topics.map((g) => (
                    <details key={g.id} className="rounded-xl border border-border/60 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground">{g.title}</summary>
                        <h3 className={`${heading} mt-3`}>Fragen</h3>
                        <ul className={list}>{g.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                        <h3 className={`${heading} mt-3`}>Nachfragen</h3>
                        <ul className={list}>{g.followUpQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
                        <h3 className={`${heading} mt-3`}>Redemittel</h3>
                        <PhraseList phrases={g.usefulPhrases} />
                        <Tip text={g.tip} />
                    </details>
                ))}
                {(guide?.usefulPhrases ?? []).length > 0 && (
                    <div className="rounded-xl border border-border/60 p-3">
                        <h3 className={heading}>Im Gespräch</h3>
                        <PhraseList phrases={guide?.usefulPhrases ?? []} />
                    </div>
                )}
            </div>
        );
    }

    const groups =
        content.taskType === "OPINION_DISCUSSION"
            ? (guide?.goals ?? []).map((g) => ({ key: g.id, title: g.title, phrases: g.usefulPhrases, tip: g.tip }))
            : (guide?.functions ?? []).map((f) => ({ key: f.function, title: f.title, phrases: f.usefulPhrases, tip: f.tip }));
    const extra = content.taskType === "JOINT_PLANNING" ? (content.extraPhrases ?? []) : [];
    const criteria = content.taskType === "JOINT_PLANNING" ? (content.decisionCriteria?.length ? content.decisionCriteria : (guide?.decisionCriteria ?? [])) : [];
    if (groups.length === 0 && extra.length === 0) return <p className="text-sm text-foreground/55">Hier gibt es noch keine Redemittel.</p>;
    return (
        <div className="space-y-3">
            {extra.length > 0 && (
                <div className="rounded-xl border border-border/60 p-3">
                    <h3 className={heading}>Passend zu dieser Aufgabe</h3>
                    <PhraseList phrases={extra} />
                </div>
            )}
            {groups.map((g) => (
                <div key={g.key} className="rounded-xl border border-border/60 p-3">
                    <h3 className={heading}>{g.title}</h3>
                    <PhraseList phrases={g.phrases} />
                    <Tip text={g.tip} />
                </div>
            ))}
            {criteria.length > 0 && (
                <div className="rounded-xl border border-border/60 p-3">
                    <h3 className={heading}>Woran Sie eine gute Einigung erkennen</h3>
                    <ul className={list}>{criteria.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
            )}
        </div>
    );
}

/** Tab "Fehler": the typical mistakes of the Teil. */
export function SpeakingMistakesPanel({ guide }: Readonly<{ guide?: SpeakingGuideContent | null }>) {
    const mistakes = guide?.commonMistakes ?? [];
    if (mistakes.length === 0) return <p className="text-sm text-foreground/55">Hier gibt es noch keine Einträge.</p>;
    return <ul className="space-y-2 text-sm text-foreground/85">{mistakes.map((m) => <li key={m} className="rounded-xl bg-orange-500/10 p-3">⚠️ {m}</li>)}</ul>;
}

/** True when the exercise has example answers / a dialogue / a model response to reveal. */
export function hasSpeakingModel(content: SpeakingContent): boolean {
    if (content.taskType === "TOPIC_INTERVIEW") return (content.topics ?? []).some((t) => t.exampleAnswers.length > 0);
    if (content.taskType === "OPINION_DISCUSSION") return !!content.exampleResponse;
    return (content.exampleDialogue ?? []).length > 0;
}

/** Example answers, the example response or the example dialogue of this exercise. */
export function SpeakingModel({ content }: Readonly<{ content: SpeakingContent }>) {
    if (content.taskType === "TOPIC_INTERVIEW") {
        return (
            <section className={card} aria-label="Beispielantworten">
                <h2 className={heading}>Beispielantworten</h2>
                {content.exampleProfile && <p className="mt-1 text-xs text-foreground/60">{content.exampleProfile}</p>}
                {(content.topics ?? []).map((topic) => (
                    <div key={topic.id} className="mt-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{topic.title}</h3>
                        <ul className={list}>{topic.exampleAnswers.map((a) => <li key={a}>{a}</li>)}</ul>
                    </div>
                ))}
            </section>
        );
    }
    if (content.taskType === "OPINION_DISCUSSION") {
        return (
            <section className={card} aria-label="Beispielantwort">
                <h2 className={heading}>Beispielantwort</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">{content.exampleResponse}</p>
            </section>
        );
    }
    return (
        <section className={card} aria-label="Beispieldialog">
            <h2 className={heading}>Beispieldialog</h2>
            <ol className="mt-2 space-y-2 text-sm text-foreground/85">
                {(content.exampleDialogue ?? []).map((turn, index) => (
                    <li key={`${turn.speaker}-${index}`}>
                        <span className="font-semibold">{turn.speaker}:</span> {turn.text}
                    </li>
                ))}
            </ol>
        </section>
    );
}

/** The whole Lernbereich of one Teil, with an anchor on every section so exercises can link straight to it. */
export function GuideLearnView({ guide, part }: Readonly<{ guide: SpeakingGuideContent; part: number }>) {
    return (
        <div className="space-y-4">
            <section className={card} aria-label="Einführung">
                <p className="whitespace-pre-line text-sm text-foreground/85">{guide.intro}</p>
            </section>

            {guide.steps.length > 0 && (
                <section className={card} aria-label="Ablauf">
                    <h2 className={heading}>So läuft es ab</h2>
                    <ol className="mt-2 space-y-2 text-sm text-foreground/85">
                        {guide.steps.map((step) => (
                            <li key={step.title}>
                                <span className="font-semibold">{step.title}.</span> {step.text}
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            <section id="tipps" className={`${card} scroll-mt-24`} aria-label="Tipps">
                <h2 className={heading}>Tipps</h2>
                <ul className="mt-2 space-y-2 text-sm text-foreground/85">
                    {guide.tips.map((tip) => (
                        <li key={tip.title}>
                            <span className="font-semibold">{tip.title}.</span> {tip.text}
                        </li>
                    ))}
                </ul>
            </section>

            {part === 1 &&
                (guide.topics ?? []).map((topic) => (
                    <section key={topic.id} id={`topic-${topic.id}`} className={`${card} scroll-mt-24`} aria-label={topic.title}>
                        <h2 className={heading}>{topic.title}</h2>
                        <h3 className={`${heading} mt-3`}>Fragen</h3>
                        <ul className={list}>{topic.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                        <h3 className={`${heading} mt-3`}>Nachfragen</h3>
                        <ul className={list}>{topic.followUpQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
                        <h3 className={`${heading} mt-3`}>Redemittel</h3>
                        <PhraseList phrases={topic.usefulPhrases} />
                        <Tip text={topic.tip} />
                    </section>
                ))}
            {part === 1 && (guide.usefulPhrases ?? []).length > 0 && (
                <section id="allgemein" className={`${card} scroll-mt-24`} aria-label="Allgemeine Redemittel">
                    <h2 className={heading}>Im Gespräch</h2>
                    <PhraseList phrases={guide.usefulPhrases ?? []} />
                </section>
            )}

            {part === 2 &&
                (guide.goals ?? []).map((goal, index) => (
                    <section key={goal.id} id={`goal-${goal.id}`} className={`${card} scroll-mt-24`} aria-label={goal.title}>
                        <h2 className={heading}>
                            {index + 1}. {goal.title}
                        </h2>
                        <p className="mt-1 text-sm text-foreground/75">{goal.description}</p>
                        <PhraseList phrases={goal.usefulPhrases} />
                        <Tip text={goal.tip} />
                    </section>
                ))}

            {part === 3 &&
                (guide.functions ?? []).map((group) => (
                    <section key={group.function} id={`function-${group.function}`} className={`${card} scroll-mt-24`} aria-label={group.title}>
                        <h2 className={heading}>{group.title}</h2>
                        <PhraseList phrases={group.usefulPhrases} />
                        <Tip text={group.tip} />
                    </section>
                ))}
            {part === 3 && (guide.decisionCriteria ?? []).length > 0 && (
                <section className={card} aria-label="Einigung">
                    <h2 className={heading}>Woran Sie eine gute Einigung erkennen</h2>
                    <ul className={list}>{(guide.decisionCriteria ?? []).map((c) => <li key={c}>{c}</li>)}</ul>
                </section>
            )}

            {guide.commonMistakes.length > 0 && (
                <section className={card} aria-label="Typische Fehler">
                    <h2 className={heading}>Typische Fehler</h2>
                    <ul className={list}>{guide.commonMistakes.map((m) => <li key={m}>{m}</li>)}</ul>
                </section>
            )}

            <section className={card} aria-label="Checkliste">
                <h2 className={heading}>Checkliste nach der Übung</h2>
                <ul className={list}>{guide.selfAssessment.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
        </div>
    );
}
