import { SpeakingGuideContent } from "@/types/exam";
import Slide, { Chips } from "@/componenets/exam/writing/learn/Slide";
import ChoiceQuiz from "@/componenets/exam/writing/learn/games/ChoiceQuiz";
import TapChecklist from "@/componenets/exam/writing/learn/games/TapChecklist";
import { seededRandom, shuffled } from "@/componenets/exam/writing/learn/random";
import { LessonStep, Station } from "@/componenets/exam/writing/learn/types";
import { SPEAKING_SECTIONS, SpeakingStationId } from "../speakingMeta";

const QUESTIONS = 5;
const OPTIONS = 4;
const CHECKLIST_CHUNK = 5;

/** What the Redemittel / questions of a Teil are grouped by: topics (Teil 1), goals (Teil 2), functions (Teil 3). */
interface Category {
    id: string;
    title: string;
    phrases: string[];
    questions: string[];
    followUps: string[];
    tip?: string | null;
}

function categoriesOf(guide: SpeakingGuideContent, part: number): Category[] {
    if (part === 1) {
        return (guide.topics ?? []).map((t) => ({ id: t.id, title: t.title, phrases: t.usefulPhrases, questions: t.questions, followUps: t.followUpQuestions, tip: t.tip }));
    }
    if (part === 2) {
        return (guide.goals ?? []).map((g) => ({ id: g.id, title: g.title, phrases: g.usefulPhrases, questions: [], followUps: [], tip: g.tip }));
    }
    return (guide.functions ?? []).map((f) => ({ id: f.function, title: f.title, phrases: f.usefulPhrases, questions: [], followUps: [], tip: f.tip }));
}

/** Quiz steps "which category does this item belong to?" - one item per category first, so the questions are varied. */
function categoryQuizzes(prefix: string, categories: Category[], itemsOf: (c: Category) => string[], question: string, rand: () => number): LessonStep[] {
    if (categories.length < 3) return [];
    const picked = shuffled(categories, rand)
        .map((c) => ({ category: c, item: shuffled(itemsOf(c), rand)[0] }))
        .filter((x): x is { category: Category; item: string } => !!x.item)
        .slice(0, QUESTIONS);
    return picked.map(({ category, item }, i) => {
        const distractors = shuffled(categories.filter((c) => c.id !== category.id), rand).slice(0, OPTIONS - 1);
        const options = shuffled([category, ...distractors], rand).map((c) => ({ id: c.id, label: c.title }));
        return {
            id: `${prefix}-quiz-${category.id}`,
            gated: true,
            render: (api) => <ChoiceQuiz api={api} salt={i} question={question} quote={item} options={options} correctId={category.id} explanation={category.tip ?? null} />,
        };
    });
}

function ablaufSteps(guide: SpeakingGuideContent): LessonStep[] {
    const steps: LessonStep[] = [
        {
            id: "ablauf-intro",
            render: () => (
                <Slide emoji="🎯" eyebrow="So läuft es ab" title="Das erwartet dich">
                    <p className="whitespace-pre-line text-base text-foreground/85">{guide.intro}</p>
                </Slide>
            ),
        },
    ];
    if (guide.steps.length > 0) {
        steps.push({
            id: "ablauf-steps",
            render: () => (
                <Slide emoji="🪜" eyebrow="Der Ablauf" title="Schritt für Schritt">
                    <ol className="space-y-3">
                        {guide.steps.map((s) => (
                            <li key={s.title}>
                                <span className="font-semibold text-foreground">{s.title}.</span> {s.text}
                            </li>
                        ))}
                    </ol>
                </Slide>
            ),
        });
    }
    return steps;
}

function tippsSteps(guide: SpeakingGuideContent): LessonStep[] {
    if (guide.tips.length === 0) return [];
    return [
        ...guide.tips.map((tip, i) => ({
            id: `tipp-${i}`,
            render: () => (
                <Slide emoji="💡" eyebrow={`Tipp ${i + 1} von ${guide.tips.length}`} title={tip.title}>
                    <p className="text-base text-foreground/85">{tip.text}</p>
                </Slide>
            ),
        })),
        {
            id: "tipps-tap",
            render: (api) => <TapChecklist api={api} prompt="Welche Tipps nimmst du dir vor?" items={guide.tips.map((t) => t.title)} requireAll={false} />,
        },
    ];
}

function fragenSteps(guide: SpeakingGuideContent, part: number, seed: string): LessonStep[] {
    const categories = categoriesOf(guide, part).filter((c) => c.questions.length > 0);
    if (categories.length === 0) return [];
    const steps: LessonStep[] = categories.map((c) => ({
        id: `fragen-${c.id}`,
        render: () => (
            <Slide emoji="❓" eyebrow="Thema" title={c.title}>
                <p className="font-semibold text-foreground">Fragen</p>
                <ul className="list-disc space-y-1 ps-5">{c.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                <p className="font-semibold text-foreground">Nachfragen</p>
                <ul className="list-disc space-y-1 ps-5">{c.followUps.map((q) => <li key={q}>{q}</li>)}</ul>
            </Slide>
        ),
    }));
    steps.push(...categoryQuizzes("fragen", categories, (c) => c.questions, "Zu welchem Thema passt diese Frage?", seededRandom(seed)));
    return steps;
}

function redemittelSteps(guide: SpeakingGuideContent, part: number, seed: string): LessonStep[] {
    const categories = categoriesOf(guide, part).filter((c) => c.phrases.length > 0);
    if (categories.length === 0) return [];
    const steps: LessonStep[] = [
        {
            id: "redemittel-intro",
            render: () => (
                <Slide emoji="💬" eyebrow="Redemittel" title="Sag es mit den richtigen Worten">
                    <p className="text-base text-foreground/85">
                        Redemittel sind feste Ausdrücke für eine Funktion im Gespräch. Zuerst lernst du sie nach Gruppen kennen, dann testest du dich.
                    </p>
                </Slide>
            ),
        },
        ...categories.map((c) => ({
            id: `redemittel-${c.id}`,
            render: () => (
                <Slide emoji="💬" eyebrow="Redemittel" title={c.title}>
                    <Chips items={c.phrases} />
                    {c.tip && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm">💡 {c.tip}</p>}
                </Slide>
            ),
        })),
    ];
    steps.push(...categoryQuizzes("redemittel", categories, (c) => c.phrases, "Wofür verwendest du dieses Redemittel?", seededRandom(seed)));
    return steps;
}

function fehlerSteps(guide: SpeakingGuideContent): LessonStep[] {
    return guide.commonMistakes.map((m, i) => ({
        id: `fehler-${i}`,
        render: () => (
            <Slide emoji="⚠️" eyebrow={`Fehler ${i + 1} von ${guide.commonMistakes.length}`} title="Das solltest du vermeiden">
                <p className="text-base text-foreground/85">{m}</p>
            </Slide>
        ),
    }));
}

function checklisteSteps(guide: SpeakingGuideContent): LessonStep[] {
    const items = guide.selfAssessment;
    if (items.length === 0) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < items.length; i += CHECKLIST_CHUNK) chunks.push(items.slice(i, i + CHECKLIST_CHUNK));
    return [
        {
            id: "checkliste-intro",
            render: () => (
                <Slide emoji="✅" eyebrow="Checkliste" title="Dein Check nach dem Gespräch">
                    <p className="text-base text-foreground/85">Gehe diese Punkte nach jeder Sprechübung durch. Dieselbe Checkliste findest du am Ende jeder Übung.</p>
                </Slide>
            ),
        },
        ...chunks.map((chunk, i) => ({
            id: `checkliste-tap-${i}`,
            render: (api: Parameters<LessonStep["render"]>[0]) => (
                <TapChecklist api={api} prompt={chunks.length > 1 ? `Meine Sprech-Checkliste (${i + 1}/${chunks.length})` : "Meine Sprech-Checkliste"} items={chunk} requireAll={false} />
            ),
        })),
    ];
}

/** Builds the lesson steps for every station that has content in the Teil's guide, in learning order. Pure and deterministic. */
export function buildSpeakingStations(guide: SpeakingGuideContent, part: number, level: string): Station[] {
    const seed = (id: SpeakingStationId) => `${level}-sprechen-${part}-${id}`;
    const byId: Record<SpeakingStationId, LessonStep[]> = {
        ablauf: ablaufSteps(guide),
        tipps: tippsSteps(guide),
        fragen: part === 1 ? fragenSteps(guide, part, seed("fragen")) : [],
        redemittel: redemittelSteps(guide, part, seed("redemittel")),
        fehler: fehlerSteps(guide),
        checkliste: checklisteSteps(guide),
    };
    return SPEAKING_SECTIONS.filter((s) => byId[s.id].length > 0).map((s) => ({ id: s.id, steps: byId[s.id] }));
}
