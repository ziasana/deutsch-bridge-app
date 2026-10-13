"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Check, ClipboardCopy, Download, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import {
    addGeneratorTopic, generateExamContentPrompt, getExamContentOptions, getGeneratorTopics, getSpeakingStarter, removeGeneratorTopic,
    restoreGeneratorTopics, setGeneratorTopicHidden, GeneratorTopics,
} from "@/services/adminExamContentService";
import { PromptResponse } from "@/types/examContent";
import ExamContentShell from "./ExamContentShell";
import { cardClass, copyText, downloadTextFile, errorMessage, fieldClass, labelClass } from "./shared";

const EXAM_LABELS: Record<string, string> = { TELC: "Telc", DTZ: "DTZ A2–B1", GOETHE: "Goethe", TESTDAF: "TestDaF", DSH: "DSH", OTHER: "Other" };

/** DTZ Lesen Teil 1 (Kataloge, Register, Verzeichnisse): labels of the generator settings; the values come from the backend. */
const DIRECTORY_TOPIC_LABELS: Record<string, string> = {
    RANDOM: "Random",
    TOWN_HALL: "Rathaus and authorities",
    LIBRARY: "Library",
    HOSPITAL: "Hospital",
    PUBLIC_TRANSPORT: "Public transport information",
    COURSE_CATALOGUE: "Course catalogue",
    JOB_TRAINING: "Job and training services",
    HOUSING: "Housing services",
    SHOPPING_SERVICES: "Shopping and services",
    SPORTS_LEISURE: "Sports and leisure",
};
const DIRECTORY_SOURCE_LABELS: Record<string, string> = {
    RANDOM: "Random",
    DIRECTORY: "Directory / Wegweiser",
    REGISTER: "Register / Verzeichnis",
    CATALOGUE: "Catalogue / Katalog",
    SERVICE_LIST: "List of services",
};
const DIRECTORY_LEVEL_LABELS: Record<string, string> = { A2: "A2", A2_B1: "A2–B1", B1: "B1" };
const DIRECTORY_VARIATION_LABELS: Record<string, string> = { RANDOM: "Random", NEW_SCENARIO: "New scenario", AVOID_KNOWN_TOPICS: "Avoid known topics" };
/** DTZ Lesen Teil 2 (Anzeigen zuordnen): labels of the generator settings; the values come from the backend. */
const AD_TOPIC_LABELS: Record<string, string> = {
    RANDOM: "Random",
    WORK: "Work",
    EDUCATION: "Education",
    COURSES: "Courses",
    FAMILY: "Family",
    LEISURE: "Leisure",
    SERVICES: "Services",
};
const AD_CATEGORY_LABELS: Record<string, string> = {
    JOBS: "Jobs and part-time work",
    TRAINING: "Training and vocational education",
    COURSES: "Language courses",
    EDUCATION: "Educational qualifications",
    DRIVING_SCHOOL: "Driving schools",
    CHILDCARE: "Childcare and babysitting",
    HOUSING: "Housing and accommodation",
    LEISURE: "Leisure activities",
    PUBLIC_SERVICES: "Public services",
    FINANCIAL_SUPPORT: "Financial support",
    COUNSELLING: "Advice and counselling",
    SPORTS_COMMUNITY: "Sports and community activities",
    CONTINUING_EDUCATION: "Continuing education",
    SERVICES: "Local services",
};
/** DTZ Lesen Teil 3 (Pressetexte und formelle Mitteilungen): labels of the generator settings; the values come from the backend. */
const LESEN_TOPIC_LABELS: Record<string, string> = {
    RANDOM: "Random",
    TRANSPORT: "Public transport and mobility",
    WORK: "Work and employment",
    EDUCATION: "Education and courses",
    FAMILY: "Family and childcare",
    HEALTH: "Health and appointments",
    HOUSING: "Housing and neighbourhood",
    LEISURE: "Leisure and events",
    PUBLIC_SERVICES: "Public services",
    SHOPPING: "Shopping and everyday life",
    ENVIRONMENT: "Environment",
    COMMUNITY: "Community projects",
};
const LESEN_MIX_LABELS: Record<string, string> = {
    RANDOM_MIX: "Random mix",
    PRESS_EMAIL_NOTICE: "Press text + email + formal notice",
    THREE_PRESS: "Three press texts",
    THREE_EMAILS: "Three emails or messages",
    THREE_NOTICES: "Three formal notices",
    CUSTOM: "Custom mix",
};
const LESEN_TYPE_LABELS: Record<string, string> = {
    PRESS_TEXT: "Press text",
    EMAIL: "Email",
    FORMAL_NOTICE: "Formal notice",
    PUBLIC_ANNOUNCEMENT: "Public announcement",
    INFORMATION_TEXT: "Information text",
};
const LESEN_LENGTH_LABELS: Record<string, string> = { SHORT: "Short (≈ 80–130 words)", MEDIUM: "Medium (≈ 100–160 words)", LONG: "Long (≈ 120–180 words)" };
/** DTZ Lesen Teil 4 (Informationstext mit richtig/falsch-Aussagen): generator settings; the values are validated by the backend. */
const TF_TOPICS: [string, string][] = [
    ["RANDOM", "Random"],
    ["SCHOOL_CHILDCARE", "School and childcare"],
    ["PUBLIC_SERVICES", "Public services"],
    ["HOUSING", "Housing"],
    ["EDUCATION_COURSES", "Education and courses"],
    ["WORK_EMPLOYMENT", "Work and employment"],
    ["HEALTH_APPOINTMENTS", "Health and appointments"],
    ["LEISURE_COMMUNITY", "Leisure and community"],
    ["PUBLIC_TRANSPORT", "Public transport"],
    ["EVERYDAY_RULES", "Everyday rules and services"],
];
const TF_STYLES: [string, string][] = [
    ["RANDOM", "Random"],
    ["INFORMATION_SHEET", "Information sheet"],
    ["FORMAL_NOTICE", "Formal notice"],
    ["INSTITUTIONAL_ANNOUNCEMENT", "Institutional announcement"],
    ["RULES_AND_CONDITIONS", "Rules and conditions"],
    ["PUBLIC_INFORMATION_TEXT", "Public information text"],
];
const TF_LENGTHS: [string, string][] = [["SHORT", "Short (≈ 180–210 words)"], ["MEDIUM", "Medium (≈ 210–260 words)"], ["LONG", "Long (≈ 260–300 words)"]];
const TF_LEVELS: [string, string][] = [["A2", "A2"], ["A2_B1", "A2–B1"], ["B1", "B1"]];
/** DTZ Lesen Teil 5 (Brief oder E-Mail mit Lücken): generator settings; the values are validated by the backend. */
const LT_TOPICS: [string, string][] = [
    ["RANDOM", "Random"],
    ["TRAVEL_ACCOMMODATION", "Travel and accommodation"],
    ["WORK_APPLICATIONS", "Work and applications"],
    ["SCHOOL_EDUCATION", "School and education"],
    ["FAMILY_FRIENDS", "Family and friends"],
    ["HEALTH_APPOINTMENTS", "Health and appointments"],
    ["HOUSING", "Housing"],
    ["COURSES_LEISURE", "Courses and leisure"],
    ["PUBLIC_SERVICES", "Public services"],
    ["SHOPPING_COMPLAINTS", "Shopping and complaints"],
    ["EVERYDAY_COMMUNICATION", "Everyday communication"],
];
const LT_TEXT_TYPES: [string, string][] = [
    ["RANDOM", "Random"],
    ["FORMAL_LETTER", "Formal letter"],
    ["FORMAL_EMAIL", "Formal email"],
    ["INFORMAL_EMAIL", "Informal email"],
    ["COMPLAINT", "Complaint"],
    ["REQUEST_FOR_INFORMATION", "Request for information"],
    ["INVITATION", "Invitation or reply"],
];
const LT_GRAMMAR: [string, string][] = [
    ["MIXED", "Mixed grammar and vocabulary"],
    ["CONNECTORS", "Connectors"],
    ["PRONOUNS", "Pronouns"],
    ["ARTICLES_ENDINGS", "Articles and endings"],
    ["PREPOSITIONS", "Prepositions"],
    ["VERB_FORMS", "Verb forms"],
    ["WORD_ORDER", "Word order"],
    ["EVERYDAY_EXPRESSIONS", "Everyday expressions"],
    ["RANDOM_MIX", "Random mix"],
];
const LT_REGISTERS: [string, string][] = [["AUTO", "Fits the text type"], ["FORMAL", "Formal (Sie)"], ["INFORMAL", "Informal (du)"]];
const labelOf = (list: [string, string][], value: string) => list.find(([v]) => v === value)?.[1] ?? value;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DIFFICULTY_LABELS: Record<string, string> = { MIXED: "Mixed (20% easy · 60% medium · 20% hard)", EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };
const SCENARIO_CHOICES: { value: string; label: string; hint: string }[] = [
    { value: "STANDARD_EMAIL", label: "Standard email", hint: "Klassische E-Mail-Situation, z. B. eine Freundin oder ein Freund schreibt dem Lernenden." },
    { value: "ALTERNATIVE_EMAIL", label: "Alternative email", hint: "Alternative realistische Alltagssituation mit derselben TELC-Schreibstruktur." },
    { value: "RANDOM", label: "Random", hint: "Der externe KI-Generator wählt eine geeignete B1-Situation." },
];
const SPEAKING_DESCRIPTIONS: Record<string, string> = {
    TOPIC_INTERVIEW: "seven core topics with questions, follow-up questions, example answers and phrases",
    OPINION_DISCUSSION: "a person's opinion text and four communication goals with phrases",
    JOINT_PLANNING: "a planning scenario with planning points, phrases per function and an optional dialogue",
};
const topicLabel = (topic: string) => topic.charAt(0) + topic.slice(1).toLowerCase().replaceAll("_", " ");

/**
 * The topic list of one generator: the built-in topics (minus the ones the admin removed) and the admin's own topics. Adding, removing
 * and restoring topics is saved on the server, so the list is the same after a reload and for every admin. Clicking a chip selects it
 * for the prompt; the × removes it from the list.
 */
function TopicChips({ partKey, builtIn, selected, onChange }: Readonly<{ partKey: string; builtIn: [string, string][]; selected: string[]; onChange: (topics: string[]) => void }>) {
    const queryClient = useQueryClient();
    const queryKey = ["admin", "exam-content", "topics", partKey];
    const { data } = useQuery({ queryKey, queryFn: () => getGeneratorTopics(partKey).then((r) => r.data) });
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const hidden = data?.hidden ?? [];
    const custom = data?.custom ?? [];
    const visible = builtIn.filter(([value]) => value !== "RANDOM" && !hidden.includes(value));

    const save = async (request: Promise<{ data: GeneratorTopics }>, fallback: string) => {
        setSaving(true);
        try {
            queryClient.setQueryData(queryKey, (await request).data);
            return true;
        } catch (err) {
            toast.error(errorMessage(err, fallback));
            return false;
        } finally {
            setSaving(false);
        }
    };
    const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((t) => t !== value) : [...selected, value]);
    const add = async () => {
        const topic = draft.replace(/\s+/g, " ").trim().slice(0, 60);
        if (!topic) return;
        if (await save(addGeneratorTopic(partKey, topic), "Could not save the topic.")) {
            setDraft("");
            const saved = custom.find((t) => t.toLowerCase() === topic.toLowerCase()) ?? topic;
            if (!selected.some((t) => t.toLowerCase() === saved.toLowerCase())) onChange([...selected, saved]);
        }
    };
    const removeBuiltIn = async (value: string) => {
        if (await save(setGeneratorTopicHidden(partKey, value, true), "Could not remove the topic.")) onChange(selected.filter((t) => t !== value));
    };
    const removeCustom = async (topic: string) => {
        if (await save(removeGeneratorTopic(partKey, topic), "Could not remove the topic.")) onChange(selected.filter((t) => t !== topic));
    };
    const chip = (value: string, label: string, onRemove: () => void) => {
        const on = selected.includes(value);
        return (
            <span key={value} className={`inline-flex items-center rounded-full border text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200"}`}>
                <button type="button" aria-pressed={on} onClick={() => toggle(value)} className="rounded-full py-1 pl-3 pr-1.5">{label}</button>
                <button type="button" aria-label={`Remove topic ${label}`} disabled={saving} onClick={onRemove} className="rounded-full py-1 pl-0.5 pr-2.5 leading-none opacity-70 hover:opacity-100">×</button>
            </span>
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {visible.map(([value, label]) => chip(value, label, () => void removeBuiltIn(value)))}
                {custom.map((topic) => chip(topic, topic, () => void removeCustom(topic)))}
            </div>
            {hidden.length > 0 && (
                <button type="button" disabled={saving} onClick={() => void save(restoreGeneratorTopics(partKey), "Could not restore the topics.")} className="text-xs text-blue-600 underline dark:text-blue-400">
                    Restore removed topics ({hidden.length})
                </button>
            )}
            <div className="flex gap-2">
                <input
                    aria-label="Add your own topic"
                    value={draft}
                    maxLength={60}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            void add();
                        }
                    }}
                    placeholder="Add your own topic, e.g. Umzug in eine neue Stadt"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button type="button" onClick={() => void add()} disabled={!draft.trim() || saving} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold hover:bg-accent disabled:opacity-50">
                    Add topic
                </button>
            </div>
        </div>
    );
}

/** Builds the copy-paste prompt for any external AI; the backend never calls an AI itself. */
function ChipButton({ on, label, onClick }: Readonly<{ on: boolean; label: string; onClick: () => void }>) {
    return (
        <button
            type="button"
            aria-pressed={on}
            onClick={onClick}
            className={`rounded-full border px-3 py-1 text-sm transition ${
                on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
        >
            {label}
        </button>
    );
}

export default function ContentGenerator() {
    const { userProfile, hasHydrated } = useAuthStore();
    const { data: options, isLoading } = useQuery({
        queryKey: ["admin", "exam-content", "options"],
        queryFn: () => getExamContentOptions().then((r) => r.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });

    const [exam, setExam] = useState("TELC");
    const [level, setLevel] = useState("B1");
    const [section, setSection] = useState("LESEN");
    const [part, setPart] = useState("TEIL_1");
    const [count, setCount] = useState("10");
    const [difficulty, setDifficulty] = useState("MIXED");
    const [topics, setTopics] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [includeVisuals, setIncludeVisuals] = useState(true);
    const [textType, setTextType] = useState("");
    const [contextMode, setContextMode] = useState("RANDOM");
    const [scenarioType, setScenarioType] = useState("RANDOM");
    const [relationship, setRelationship] = useState("");
    const [communicationType, setCommunicationType] = useState("");
    const [wordCats, setWordCats] = useState<string[] | null>(null); // null = all
    const [grammar, setGrammar] = useState<string[] | null>(null); // null = all categories
    const [dirTopics, setDirTopics] = useState<string[]>([]); // empty = random
    const [dirSourceType, setDirSourceType] = useState("RANDOM");
    const [dirLevel, setDirLevel] = useState("A2_B1");
    const [dirExample, setDirExample] = useState(true);
    const [dirVariation, setDirVariation] = useState("RANDOM");
    const [adTopicSel, setAdTopicSel] = useState<string[]>([]); // DTZ Lesen Teil 2; empty = random
    const [adCats, setAdCats] = useState<string[]>([]); // empty = chosen by the AI
    const [adLevel, setAdLevel] = useState("A2_B1");
    const [adExample, setAdExample] = useState(false);
    const [adVariation, setAdVariation] = useState("RANDOM");
    const [txTopics, setTxTopics] = useState<string[]>([]); // DTZ Lesen Teil 3; empty = random
    const [txMix, setTxMix] = useState("RANDOM_MIX");
    const [txCustom, setTxCustom] = useState<string[]>(["PRESS_TEXT", "EMAIL", "FORMAL_NOTICE"]);
    const [txLevel, setTxLevel] = useState("A2_B1");
    const [txLength, setTxLength] = useState("MEDIUM");
    const [txDates, setTxDates] = useState(true);
    const [txVariation, setTxVariation] = useState("RANDOM");
    const [txTags, setTxTags] = useState("");
    const [tfTopics, setTfTopics] = useState<string[]>([]); // DTZ Lesen Teil 4; empty = random
    const [tfLevel, setTfLevel] = useState("A2_B1");
    const [tfLength, setTfLength] = useState("MEDIUM");
    const [tfStyle, setTfStyle] = useState("RANDOM");
    const [ltTopics, setLtTopics] = useState<string[]>([]); // DTZ Lesen Teil 5; empty = random
    const [ltLevel, setLtLevel] = useState("A2_B1");
    const [ltTextType, setLtTextType] = useState("RANDOM");
    const [ltGrammar, setLtGrammar] = useState("MIXED");
    const [ltRegister, setLtRegister] = useState("AUTO");
    const [ltExample, setLtExample] = useState(true);
    const [ltAvoidRecent, setLtAvoidRecent] = useState(false);
    const [ltNewScenario, setLtNewScenario] = useState(true);
    const [result, setResult] = useState<PromptResponse | null>(null);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Deep link from the DTZ Lesen Teil 1 page ("?exam=DTZ&section=LESEN&part=TEIL_1"): preselect that exam part on arrival.
    useEffect(() => {
        const params = new URL(window.location.href).searchParams;
        if (params.get("exam")) setExam(params.get("exam")!);
        if (params.get("exam") === "DTZ") setLevel("B1"); // DTZ exercises are stored with level B1 (shown as A2–B1)
        if (params.get("section")) setSection(params.get("section")!);
        if (params.get("part")) setPart(params.get("part")!);
    }, []);

    const sections = useMemo(() => [...new Map((options?.specs ?? []).map((s) => [s.section, s.sectionLabel])).entries()], [options]);
    const parts = useMemo(() => [...new Set((options?.specs ?? []).filter((s) => s.section === section).map((s) => s.part))], [options, section]);
    const spec = options?.specs.find((s) => s.exam === exam && s.level === level && s.section === section && s.part === part);

    const allCategories = options?.grammarCategories ?? [];
    const selectedCategories = grammar ?? allCategories;
    const toggleCategory = (category: string) =>
        setGrammar(selectedCategories.includes(category) ? selectedCategories.filter((c) => c !== category) : [...selectedCategories, category]);

    const allWordCategories = options?.wordCategories ?? [];
    const selectedWordCategories = wordCats ?? allWordCategories;
    const toggleWordCategory = (category: string) =>
        setWordCats(selectedWordCategories.includes(category) ? selectedWordCategories.filter((c) => c !== category) : [...selectedWordCategories, category]);

    const directorySpec = spec?.taskType === "DIRECTORY_MATCHING";
    const adSpec = spec?.taskType === "SITUATION_MATCHING" && spec.exam === "DTZ";
    const textSpec = spec?.taskType === "TEXT_QUESTIONS";
    const tfSpec = spec?.taskType === "TEXT_TRUE_FALSE";
    const letterSpec = spec?.taskType === "LETTER_GAP_FILL";
    // The settings travel in the generic prompt-request fields: topic -> topics, text type -> textType, grammar focus -> grammarCategories,
    // register -> communicationType. With more than one set the AI returns one batch file.
    // The shared set count starts at 10 for the other parts; one exercise is the natural start for Teil 5.
    useEffect(() => {
        if (letterSpec) setCount("1");
    }, [letterSpec]);
    const ltRequest = useMemo(
        () => ({
            exam, level, section, part, count: Math.min(50, Math.max(1, Number.parseInt(count, 10) || 1)), difficulty: ltLevel, topics: ltTopics, notes: notes.trim() || undefined,
            textType: ltTextType === "RANDOM" ? undefined : ltTextType, grammarCategories: [ltGrammar],
            communicationType: ltRegister === "AUTO" ? undefined : ltRegister, includeExample: ltExample,
            variation: ltAvoidRecent ? "AVOID_KNOWN_TOPICS" : ltNewScenario ? "NEW_SCENARIO" : "RANDOM",
        }),
        [exam, level, section, part, count, ltLevel, ltTopics, notes, ltTextType, ltGrammar, ltRegister, ltExample, ltAvoidRecent, ltNewScenario],
    );

    // The DTZ Teil 5 prompt follows its settings: every change asks the backend for the updated prompt.
    useEffect(() => {
        if (!letterSpec) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            generateExamContentPrompt(ltRequest)
                .then((res) => { if (!cancelled) setResult(res.data); })
                .catch((err) => { if (!cancelled) toast.error(errorMessage(err, "Failed to generate the prompt.")); });
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [letterSpec, ltRequest]);
    // The shared set count starts at 10 for the other parts; one exercise is the natural start for Teil 4.
    useEffect(() => {
        if (tfSpec) setCount("1");
    }, [tfSpec]);
    // The text style travels in the generic textType field of the prompt request.
    const tfRequest = useMemo(
        () => ({
            exam, level, section, part, count: Math.min(50, Math.max(1, Number.parseInt(count, 10) || 1)), difficulty: tfLevel, topics: tfTopics, notes: notes.trim() || undefined,
            textType: tfStyle === "RANDOM" ? undefined : tfStyle, textLength: tfLength,
        }),
        [exam, level, section, part, count, tfLevel, tfTopics, notes, tfStyle, tfLength],
    );

    // The DTZ Teil 4 prompt follows its settings: every change asks the backend for the updated prompt.
    useEffect(() => {
        if (!tfSpec) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            generateExamContentPrompt(tfRequest)
                .then((res) => { if (!cancelled) setResult(res.data); })
                .catch((err) => { if (!cancelled) toast.error(errorMessage(err, "Failed to generate the prompt.")); });
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [tfSpec, tfRequest]);
    const txRequest = useMemo(
        () => ({
            exam, level, section, part, count: Math.min(50, Math.max(1, Number.parseInt(count, 10) || 1)), difficulty: txLevel, topics: txTopics, notes: notes.trim() || undefined,
            variation: txVariation, textMix: txMix, customTextTypes: txMix === "CUSTOM" ? txCustom : undefined, textLength: txLength, includeDatesTimes: txDates,
            tags: txTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
        [exam, level, section, part, count, txLevel, txTopics, notes, txVariation, txMix, txCustom, txLength, txDates, txTags],
    );

    // The DTZ Teil 3 prompt follows its settings as well: every change asks the backend for the updated prompt.
    useEffect(() => {
        if (!textSpec) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            generateExamContentPrompt(txRequest)
                .then((res) => { if (!cancelled) setResult(res.data); })
                .catch((err) => { if (!cancelled) toast.error(errorMessage(err, "Failed to generate the prompt.")); });
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [textSpec, txRequest]);

    const adRequest = useMemo(
        () => ({
            exam, level, section, part, count: Math.min(50, Math.max(1, Number.parseInt(count, 10) || 1)), difficulty: adLevel, topics: adTopicSel, notes: notes.trim() || undefined,
            includeExample: adExample, variation: adVariation, adCategories: adCats,
        }),
        [exam, level, section, part, count, adLevel, adTopicSel, notes, adExample, adVariation, adCats],
    );

    // The DTZ Teil 2 prompt follows its settings: every change asks the backend for the updated prompt.
    useEffect(() => {
        if (!adSpec) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            generateExamContentPrompt(adRequest)
                .then((res) => { if (!cancelled) setResult(res.data); })
                .catch((err) => { if (!cancelled) toast.error(errorMessage(err, "Failed to generate the prompt.")); });
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [adSpec, adRequest]);
    const toggleTopic = (topic: string) => setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));

    const generate = async (e: React.FormEvent) => {
        e.preventDefault();
        const n = Number(count);
        if (!Number.isInteger(n) || n < 1 || n > 50) {
            toast.error("Number of exercise sets must be between 1 and 50.");
            return;
        }
        const gapSpec = spec?.section === "SPRACHBAUSTEINE" && spec.taskType === "MULTIPLE_CHOICE";
        const wordBankSpec = spec?.taskType === "WORD_BANK_CLOZE";
        if (wordBankSpec && selectedWordCategories.length < 3) {
            toast.error("Select at least 3 word categories so the word bank can be varied.");
            return;
        }
        if (gapSpec && selectedCategories.length < 5) {
            toast.error("Select at least 5 grammar categories so the ten gaps can be varied.");
            return;
        }
        const writingSpec = spec?.taskType === "WRITING_TASK";
        setGenerating(true);
        try {
            const res = await generateExamContentPrompt(letterSpec
                ? ltRequest
                : tfSpec
                ? tfRequest
                : textSpec
                ? txRequest
                : adSpec
                ? adRequest
                : directorySpec
                ? {
                    // The settings only shape the content, never the 5 x 3 structure.
                    exam, level, section, part, count: n, difficulty: dirLevel, topics: dirTopics,
                    notes: notes.trim() || undefined, sourceType: dirSourceType, includeExample: dirExample, variation: dirVariation,
                }
                : {
                exam, level, section, part, count: n, difficulty, topics, notes: notes.trim() || undefined, includeVisuals,
                ...(wordBankSpec
                    ? { contextMode, wordCategories: selectedWordCategories.length === allWordCategories.length ? undefined : selectedWordCategories }
                    : {}),
                ...(writingSpec
                    ? { scenarioType, relationship: relationship || undefined, communicationType: communicationType || undefined }
                    : {}),
                ...(gapSpec ? { textType: textType || undefined, grammarCategories: selectedCategories.length === allCategories.length ? undefined : selectedCategories } : {}),
            });
            setResult(res.data);
        } catch (err) {
            toast.error(errorMessage(err, "Failed to generate the prompt."));
        } finally {
            setGenerating(false);
        }
    };

    const copy = async (key: string, text: string) => {
        if (await copyText(text)) {
            setCopied(key);
            toast.success("Copied to clipboard.");
            setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
        } else {
            toast.error("Copy failed - select the text and copy it manually.");
        }
    };

    return (
        <ExamContentShell
            title="Content Generator"
            description="Create original exam exercises with any AI (Claude, ChatGPT, Gemini ...): configure the content here, copy the generated prompt into the AI, then import the JSON it returns."
        >
            {isLoading ? (
                <Loading message="Loading..." />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                    <form onSubmit={generate} className={`${cardClass} p-6 space-y-4 self-start`}>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Prompt configuration</h2>

                        <div className="grid grid-cols-2 gap-3">
                            <label>
                                <span className={labelClass}>Exam</span>
                                <select className={fieldClass} value={exam} onChange={(e) => setExam(e.target.value)}>
                                    {(options?.exams ?? []).map((x) => (
                                        <option key={x} value={x}>{EXAM_LABELS[x] ?? x}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span className={labelClass}>Level</span>
                                <select className={fieldClass} value={level} onChange={(e) => setLevel(e.target.value)}>
                                    {LEVELS.map((x) => <option key={x}>{x}</option>)}
                                </select>
                            </label>
                            <label>
                                <span className={labelClass}>Section</span>
                                <select
                                    className={fieldClass}
                                    value={section}
                                    onChange={(e) => {
                                        setSection(e.target.value);
                                        const first = options?.specs.find((s) => s.section === e.target.value);
                                        if (first) setPart(first.part);
                                    }}
                                >
                                    {sections.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </label>
                            <label>
                                <span className={labelClass}>Teil</span>
                                <select className={fieldClass} value={part} onChange={(e) => setPart(e.target.value)}>
                                    {parts.map((x) => <option key={x} value={x}>{x.replace("TEIL_", "Teil ")}</option>)}
                                </select>
                            </label>
                        </div>

                        {spec ? (
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {spec.section === "MUENDLICHER_AUSDRUCK"
                                    ? `✓ ${spec.label}: ${SPEAKING_DESCRIPTIONS[spec.taskType] ?? "speaking task"} (German-only content, no translations).`
                                    : spec.taskType === "WRITING_TASK"
                                    ? `✓ ${spec.label}: one incoming email and exactly ${spec.questionCount} content points to answer in writing.`
                                    : spec.taskType === "MULTIPLE_CHOICE"
                                    ? `✓ ${spec.label}: one reading text, ${spec.questionCount} questions with ${spec.optionCount} options each.`
                                    : spec.taskType === "WORD_BANK_CLOZE"
                                    ? `✓ ${spec.label}: one text with ${spec.questionCount} gaps (31–40), ${spec.optionCount} words (a–o), ${spec.optionCount - spec.questionCount} stay unused.`
                                    : spec.section === "SPRACHBAUSTEINE"
                                    ? `✓ ${spec.label}: one text with ${spec.questionCount} gaps (21–30), ${spec.optionCount} options (a, b, c) each.`
                                    : spec.taskType === "DIRECTORY_MATCHING"
                                    ? `✓ ${spec.label}: one information source (Wegweiser, Verzeichnis, Katalog ...) and exactly ${spec.questionCount} situations (21–25) with ${spec.optionCount} options each.`
                                    : letterSpec
                                    ? `✓ ${spec.label}: one letter or email with exactly ${spec.questionCount} gaps (40–45), ${spec.optionCount} options (a, b, c) each; an optional example gap (0) is not scored.`
                                    : tfSpec
                                    ? `✓ ${spec.label}: one information text and exactly ${spec.questionCount} richtig/falsch statements (37–39).`
                                    : textSpec
                                    ? `✓ ${spec.label}: ${spec.textCount} texts, each with a richtig/falsch task and a multiple-choice task (a, b, c) — questions 31–36.`
                                    : adSpec
                                    ? `✓ ${spec.label}: ${spec.questionCount} situations (26–30), ${spec.optionCount} advertisements (a–h); four situations match one advertisement each, exactly one has the answer X.`
                                    : spec.taskType === "SITUATION_MATCHING"
                                    ? `✓ ${spec.label}: ${spec.questionCount} situations, ${spec.optionCount} advertisements (a–l), x = no advertisement fits.`
                                    : `✓ ${spec.label}: ${spec.textCount} texts, ${spec.headingCount} headings (${spec.headingCount - spec.textCount} unused).`}
                            </p>
                        ) : (
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                No content specification exists for this combination yet. Available:{" "}
                                {(options?.specs ?? []).map((s) => s.label).join("; ") || "none"}.
                            </p>
                        )}

                        {spec?.section === "MUENDLICHER_AUSDRUCK" && (
                            <Button
                                type="button"
                                variant="secondary"
                                className="inline-flex items-center gap-1.5 text-sm"
                                onClick={async () => {
                                    try {
                                        const res = await getSpeakingStarter(Number(part.replace("TEIL_", "")));
                                        downloadTextFile(`B1-Muendlicher-Ausdruck-${part}-start.json`, res.data, "application/json");
                                    } catch (err) {
                                        toast.error(errorMessage(err, "Could not download the starter file."));
                                    }
                                }}
                            >
                                <Download className="size-4" />Starter exercise (JSON, import-ready)
                            </Button>
                        )}

                        {spec?.taskType === "SITUATION_MATCHING" && !adSpec && (
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input type="checkbox" checked={includeVisuals} onChange={(e) => setIncludeVisuals(e.target.checked)} />
                                Include visual briefs (image type, image prompt, alt text) for the advertisements
                            </label>
                        )}

                        {letterSpec && (
                            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generation settings</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <label>
                                        <span className={labelClass}>Number of exercise sets</span>
                                        <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Text type</span>
                                        <select className={fieldClass} value={ltTextType} onChange={(e) => setLtTextType(e.target.value)}>
                                            {LT_TEXT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Difficulty</span>
                                        <select className={fieldClass} value={ltLevel} onChange={(e) => setLtLevel(e.target.value)}>
                                            {TF_LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Grammar focus</span>
                                        <select className={fieldClass} value={ltGrammar} onChange={(e) => setLtGrammar(e.target.value)}>
                                            {LT_GRAMMAR.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                    <label className="col-span-2">
                                        <span className={labelClass}>Register</span>
                                        <select className={fieldClass} value={ltRegister} onChange={(e) => setLtRegister(e.target.value)}>
                                            {LT_REGISTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                </div>
                                <fieldset>
                                    <legend className={labelClass}>Topic {ltTopics.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                                    <TopicChips partKey={`${exam}_${part}`} builtIn={LT_TOPICS} selected={ltTopics} onChange={setLtTopics} />
                                </fieldset>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input type="checkbox" checked={ltExample} onChange={(e) => setLtExample(e.target.checked)} />
                                        Include example gap (0)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input type="checkbox" checked={ltAvoidRecent} onChange={(e) => setLtAvoidRecent(e.target.checked)} />
                                        Avoid recently used topics
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input type="checkbox" checked={ltNewScenario} onChange={(e) => setLtNewScenario(e.target.checked)} />
                                        Generate a different scenario from existing exercises
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Fixed by the DTZ format: one letter or email, six gaps numbered 40–45, three options (a, b, c) per gap. The settings only shape the content.
                                    Explanations are requested in German, English and Persian. With more than one set the AI returns one batch file. Imported content is always saved as a draft.
                                </p>
                            </div>
                        )}

                        {tfSpec && (
                            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generation settings</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <label>
                                        <span className={labelClass}>Number of exercise sets</span>
                                        <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Difficulty</span>
                                        <select className={fieldClass} value={tfLevel} onChange={(e) => setTfLevel(e.target.value)}>
                                            {TF_LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Text length</span>
                                        <select className={fieldClass} value={tfLength} onChange={(e) => setTfLength(e.target.value)}>
                                            {TF_LENGTHS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Text style</span>
                                        <select className={fieldClass} value={tfStyle} onChange={(e) => setTfStyle(e.target.value)}>
                                            {TF_STYLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </label>
                                </div>
                                <fieldset>
                                    <legend className={labelClass}>Topic {tfTopics.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                                    <TopicChips partKey={`${exam}_${part}`} builtIn={TF_TOPICS} selected={tfTopics} onChange={setTfTopics} />
                                </fieldset>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Fixed by the DTZ format: one text and three richtig/falsch statements, numbered 37–39. The settings only shape the content.
                                    Explanations are requested in German, English and Persian. With more than one set the AI returns one batch file. Imported content is always saved as a draft.
                                </p>
                            </div>
                        )}

                        {textSpec && (
                            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generation settings</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <label>
                                        <span className={labelClass}>Number of exercise sets</span>
                                        <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Difficulty</span>
                                        <select className={fieldClass} value={txLevel} onChange={(e) => setTxLevel(e.target.value)}>
                                            {(options?.directoryLevels ?? ["A2_B1"]).map((x) => <option key={x} value={x}>{DIRECTORY_LEVEL_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Text types</span>
                                        <select className={fieldClass} value={txMix} onChange={(e) => setTxMix(e.target.value)}>
                                            {(options?.lesenTextMixes ?? ["RANDOM_MIX"]).map((x) => <option key={x} value={x}>{LESEN_MIX_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Text length</span>
                                        <select className={fieldClass} value={txLength} onChange={(e) => setTxLength(e.target.value)}>
                                            {(options?.lesenTextLengths ?? ["MEDIUM"]).map((x) => <option key={x} value={x}>{LESEN_LENGTH_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                    <label className="col-span-2">
                                        <span className={labelClass}>Scenario variety</span>
                                        <select className={fieldClass} value={txVariation} onChange={(e) => setTxVariation(e.target.value)}>
                                            {(options?.directoryVariations ?? ["RANDOM"]).map((x) => <option key={x} value={x}>{x === "RANDOM" ? "Random" : x === "NEW_SCENARIO" ? "Generate a new set of scenarios" : "Avoid recently used topics"}</option>)}
                                        </select>
                                    </label>
                                </div>
                                {txMix === "CUSTOM" && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {[0, 1, 2].map((i) => (
                                            <label key={i}>
                                                <span className={labelClass}>Text {i + 1}</span>
                                                <select className={fieldClass} value={txCustom[i]} onChange={(e) => setTxCustom((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}>
                                                    {(options?.lesenTextTypes ?? []).map((x) => <option key={x} value={x}>{LESEN_TYPE_LABELS[x] ?? x}</option>)}
                                                </select>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <fieldset>
                                    <legend className={labelClass}>Topic {txTopics.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                                    <TopicChips partKey={`${exam}_${part}`} builtIn={(options?.lesenTextTopics ?? []).map((v): [string, string] => [v, LESEN_TOPIC_LABELS[v] ?? v])} selected={txTopics} onChange={setTxTopics} />
                                </fieldset>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={txDates} onChange={(e) => setTxDates(e.target.checked)} />
                                    Include dates and times where appropriate
                                </label>
                                <label className="block">
                                    <span className={labelClass}>Metadata tags <span className="font-normal text-gray-500">(optional, comma-separated)</span></span>
                                    <Input value={txTags} onChange={(e) => setTxTags(e.target.value)} placeholder="e.g. verkehr, alltag" />
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Fixed by the DTZ format: three texts, two questions each (richtig/falsch, then a/b/c), numbered 31–36. The settings only shape the content.
                                    Explanations are requested in German, English and Persian. With more than one set the AI returns one batch file. Imported content is always saved as a draft.
                                </p>
                            </div>
                        )}

                        {adSpec && (
                            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generation settings</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <label>
                                        <span className={labelClass}>Number of exercise sets</span>
                                        <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Difficulty</span>
                                        <select className={fieldClass} value={adLevel} onChange={(e) => setAdLevel(e.target.value)}>
                                            {(options?.directoryLevels ?? ["A2_B1"]).map((x) => <option key={x} value={x}>{DIRECTORY_LEVEL_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Scenario variety</span>
                                        <select className={fieldClass} value={adVariation} onChange={(e) => setAdVariation(e.target.value)}>
                                            {(options?.directoryVariations ?? ["RANDOM"]).map((x) => <option key={x} value={x}>{DIRECTORY_VARIATION_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                </div>
                                <fieldset>
                                    <legend className={labelClass}>Main topic {adTopicSel.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                                    <TopicChips partKey={`${exam}_${part}`} builtIn={(options?.adTopics ?? []).map((v): [string, string] => [v, AD_TOPIC_LABELS[v] ?? v])} selected={adTopicSel} onChange={setAdTopicSel} />
                                </fieldset>
                                <fieldset>
                                    <legend className={labelClass}>Advertisement categories {adCats.length === 0 && <span className="font-normal text-gray-500">(chosen by the AI)</span>}</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {(options?.adCategories ?? []).map((category) => (
                                            <ChipButton key={category} on={adCats.includes(category)} label={AD_CATEGORY_LABELS[category] ?? category}
                                                onClick={() => setAdCats((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))} />
                                        ))}
                                    </div>
                                </fieldset>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={adExample} onChange={(e) => setAdExample(e.target.checked)} />
                                    Include an unscored example question
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Fixed by the DTZ format: situations 26–30, advertisements a–h, one X. Explanations are in German only. With more than one set the AI returns one batch file. Imported content is always saved as a draft.
                                </p>
                            </div>
                        )}

                        {directorySpec && (
                            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generation settings</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <label>
                                        <span className={labelClass}>Number of exercise sets</span>
                                        <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Information-source type</span>
                                        <select className={fieldClass} value={dirSourceType} onChange={(e) => setDirSourceType(e.target.value)}>
                                            {(options?.directorySourceTypes ?? ["RANDOM"]).map((x) => <option key={x} value={x}>{DIRECTORY_SOURCE_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Difficulty</span>
                                        <select className={fieldClass} value={dirLevel} onChange={(e) => setDirLevel(e.target.value)}>
                                            {(options?.directoryLevels ?? ["A2_B1"]).map((x) => <option key={x} value={x}>{DIRECTORY_LEVEL_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Variation</span>
                                        <select className={fieldClass} value={dirVariation} onChange={(e) => setDirVariation(e.target.value)}>
                                            {(options?.directoryVariations ?? ["RANDOM"]).map((x) => <option key={x} value={x}>{DIRECTORY_VARIATION_LABELS[x] ?? x}</option>)}
                                        </select>
                                    </label>
                                </div>
                                <fieldset>
                                    <legend className={labelClass}>Topics {dirTopics.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                                    <TopicChips partKey={`${exam}_${part}`} builtIn={(options?.directoryTopics ?? []).map((v): [string, string] => [v, DIRECTORY_TOPIC_LABELS[v] ?? v])} selected={dirTopics} onChange={setDirTopics} />
                                </fieldset>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={dirExample} onChange={(e) => setDirExample(e.target.checked)} />
                                    Include an unscored example question
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Questions are numbered 21–25 (fixed by the DTZ format). The settings shape the content only; every exercise has five scored
                                    questions with three options each. With more than one set the AI returns one batch file.
                                </p>
                            </div>
                        )}

                        {!directorySpec && !adSpec && !textSpec && !tfSpec && !letterSpec && (
                        <div className="grid grid-cols-2 gap-3">
                            <label>
                                <span className={labelClass}>Number of exercise sets</span>
                                <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                            </label>
                            <label>
                                <span className={labelClass}>Difficulty</span>
                                <select className={fieldClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                    {(options?.difficulties ?? []).map((x) => <option key={x} value={x}>{DIFFICULTY_LABELS[x] ?? x}</option>)}
                                </select>
                            </label>
                        </div>
                        )}

                        {spec?.taskType === "WRITING_TASK" && (
                            <>
                                <fieldset>
                                    <legend className={labelClass}>Scenario type</legend>
                                    <div className="space-y-1.5">
                                        {SCENARIO_CHOICES.map((choice) => (
                                            <label key={choice.value} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="radio"
                                                    name="scenarioType"
                                                    className="mt-1"
                                                    checked={scenarioType === choice.value}
                                                    onChange={() => setScenarioType(choice.value)}
                                                />
                                                <span>
                                                    <span className="font-medium">{choice.label}</span>
                                                    <span className="block text-xs text-gray-500 dark:text-gray-400">{choice.hint}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <div className="grid grid-cols-2 gap-3">
                                    <label>
                                        <span className={labelClass}>Relationship</span>
                                        <select className={fieldClass} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                                            <option value="">Chosen by the AI</option>
                                            {(options?.relationships ?? []).map((x) => <option key={x} value={x}>{topicLabel(x)}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Communication</span>
                                        <select className={fieldClass} value={communicationType} onChange={(e) => setCommunicationType(e.target.value)}>
                                            <option value="">Fits the relationship</option>
                                            {(options?.communicationTypes ?? []).map((x) => <option key={x} value={x}>{topicLabel(x.replace("_EMAIL", ""))}</option>)}
                                        </select>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Topics below set the theme. The prompt also lists your existing writing tasks, so the AI creates something different.
                                </p>
                            </>
                        )}

                        {spec?.taskType === "WORD_BANK_CLOZE" && (
                            <>
                                <label className="block">
                                    <span className={labelClass}>Context material</span>
                                    <select className={fieldClass} value={contextMode} onChange={(e) => setContextMode(e.target.value)}>
                                        <option value="RANDOM">Random</option>
                                        <option value="WITH_ADVERTISEMENT">With advertisement / information</option>
                                        <option value="WITHOUT_ADVERTISEMENT">Without advertisement</option>
                                    </select>
                                </label>
                                <fieldset>
                                    <legend className={labelClass}>Word categories <span className="font-normal text-gray-500">({selectedWordCategories.length} selected, min. 3)</span></legend>
                                    <div className="flex flex-wrap gap-2">
                                        {allWordCategories.map((category) => {
                                            const on = selectedWordCategories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => toggleWordCategory(category)}
                                                    className={`rounded-full border px-3 py-1 text-sm transition ${
                                                        on
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    }`}
                                                >
                                                    {topicLabel(category)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            </>
                        )}

                        {spec?.section === "SPRACHBAUSTEINE" && spec.taskType === "MULTIPLE_CHOICE" && (
                            <>
                                <label className="block">
                                    <span className={labelClass}>Text type</span>
                                    <select className={fieldClass} value={textType} onChange={(e) => setTextType(e.target.value)}>
                                        <option value="">Random (varied)</option>
                                        {(options?.textTypes ?? []).map((x) => <option key={x} value={x}>{topicLabel(x)}</option>)}
                                    </select>
                                </label>
                                <fieldset>
                                    <legend className={labelClass}>Grammar categories <span className="font-normal text-gray-500">({selectedCategories.length} selected, min. 5)</span></legend>
                                    <div className="flex flex-wrap gap-2">
                                        {allCategories.map((category) => {
                                            const on = selectedCategories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => toggleCategory(category)}
                                                    className={`rounded-full border px-3 py-1 text-sm transition ${
                                                        on
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    }`}
                                                >
                                                    {topicLabel(category)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            </>
                        )}

                        {!directorySpec && !adSpec && !textSpec && !tfSpec && !letterSpec && (
                        <fieldset>
                            <legend className={labelClass}>Topics {topics.length === 0 && <span className="font-normal text-gray-500">(automatic)</span>}</legend>
                            <div className="flex flex-wrap gap-2">
                                {(options?.topics ?? []).map((topic) => {
                                    const on = topics.includes(topic);
                                    return (
                                        <button
                                            key={topic}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => toggleTopic(topic)}
                                            className={`rounded-full border px-3 py-1 text-sm transition ${
                                                on
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            }`}
                                        >
                                            {topicLabel(topic)}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>
                        )}

                        <label className="block">
                            <span className={labelClass}>Extra instructions <span className="font-normal text-gray-500">(optional)</span></span>
                            <textarea className={`${fieldClass} min-h-[70px]`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="e.g. Focus on texts set in Germany's public services." />
                        </label>

                        <Button type="submit" disabled={!spec || generating} className="w-full flex items-center justify-center gap-2">
                            <Sparkles className="size-4" />
                            {generating ? "Generating..." : "Generate prompt"}
                        </Button>
                    </form>

                    <div className={`${cardClass} p-6 min-w-0`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Content Generation Prompt</h2>
                            {result && (
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-1.5" onClick={() => copy("prompt", result.prompt)}>
                                        {copied === "prompt" ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />} Copy prompt
                                    </Button>
                                    <Button variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-1.5" onClick={() => downloadTextFile(`prompt-${spec?.exam ?? exam}-${level}-${section}-${part}-v${result.promptVersion}.txt`, result.prompt)}>
                                        <Download className="size-4" /> Download .txt
                                    </Button>
                                    <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => copy("json", result.jsonExample)}>
                                        {copied === "json" ? "Copied" : "Copy JSON structure"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {result ? (
                            <>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    Prompt v{result.promptVersion} · schema v{result.schemaVersion} · {result.existingCount} existing exercise
                                    {result.existingCount === 1 ? "" : "s"} · numbering starts at <code>{result.firstExternalId}</code>
                                </p>
                                <textarea
                                    readOnly
                                    aria-label="Generated AI prompt"
                                    className={`${fieldClass} mt-3 h-[480px] font-mono text-xs leading-relaxed`}
                                    value={result.prompt}
                                    onFocus={(e) => e.currentTarget.select()}
                                />
                                {spec?.section === "MUENDLICHER_AUSDRUCK" && (
                                    <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                        ℹ️ Hinweis: Kopieren Sie diesen Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool.
                                        Alle Lerninhalte (Redemittel, Beispielantworten, Dialoge) sind nur auf Deutsch – es gibt keine englischen oder persischen Übersetzungen.
                                        Laden Sie anschließend die erzeugte JSON-Datei hoch. Importierte Aufgaben werden immer als Entwurf (DRAFT) gespeichert.
                                    </p>
                                )}
                                {letterSpec && (
                                    <div className="mt-3 space-y-3">
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-3">
                                            <div><dt className="text-xs text-gray-500">Topic</dt><dd>{ltTopics.length ? ltTopics.map((t) => labelOf(LT_TOPICS, t)).join(", ") : "Random"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Text type</dt><dd>{labelOf(LT_TEXT_TYPES, ltTextType)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Difficulty</dt><dd>{labelOf(TF_LEVELS, ltLevel)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Grammar focus</dt><dd>{labelOf(LT_GRAMMAR, ltGrammar)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Example gap (0)</dt><dd>{ltExample ? "Included" : "Not included"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Exercise sets</dt><dd>{count}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Gaps</dt><dd>40–45, options a, b, c</dd></div>
                                            <div><dt className="text-xs text-gray-500">Import status</dt><dd>Draft</dd></div>
                                        </dl>
                                        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                            ℹ️ Hinweis: Kopieren Sie den Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool. Lassen Sie die Übung als JSON erstellen,
                                            speichern Sie die Ausgabe als Datei und laden Sie sie hier hoch. Prüfen Sie vor der Veröffentlichung alle sechs Lösungen und die grammatische Eindeutigkeit.
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                                            <li>Copy the prompt and paste it into an external AI tool.</li>
                                            <li>Save the AI&apos;s answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                                            <li>Upload the file on the <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">Import JSON</Link> page, check errors, warnings and the preview.</li>
                                            <li>Import it as a draft, edit if needed, and publish it only after you have solved all six gaps from the letter yourself.</li>
                                        </ol>
                                    </div>
                                )}
                                {tfSpec && (
                                    <div className="mt-3 space-y-3">
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-3">
                                            <div><dt className="text-xs text-gray-500">Topic</dt><dd>{tfTopics.length ? tfTopics.map((t) => labelOf(TF_TOPICS, t)).join(", ") : "Random"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Text style</dt><dd>{labelOf(TF_STYLES, tfStyle)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Difficulty</dt><dd>{labelOf(TF_LEVELS, tfLevel)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Text length</dt><dd>{labelOf(TF_LENGTHS, tfLength)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Exercise sets</dt><dd>{count}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Questions</dt><dd>37–39, richtig / falsch</dd></div>
                                            <div><dt className="text-xs text-gray-500">Import status</dt><dd>Draft</dd></div>
                                        </dl>
                                        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                            ℹ️ Hinweis: Kopieren Sie den Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool. Speichern Sie die generierte
                                            JSON-Ausgabe als Datei und laden Sie sie anschließend hier hoch. Prüfen Sie den Text und alle drei Aussagen vor der Veröffentlichung.
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                                            <li>Copy the prompt and paste it into an external AI tool.</li>
                                            <li>Save the AI&apos;s answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                                            <li>Upload the file on the <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">Import JSON</Link> page, check errors, warnings and the preview.</li>
                                            <li>Import it as a draft, edit if needed, and publish it only after you have solved all three statements from the text yourself.</li>
                                        </ol>
                                    </div>
                                )}
                                {textSpec && (
                                    <div className="mt-3 space-y-3">
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-3">
                                            <div><dt className="text-xs text-gray-500">Topic</dt><dd>{txTopics.length ? txTopics.map((t) => LESEN_TOPIC_LABELS[t] ?? t).join(", ") : "Random"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Text types</dt><dd>{txMix === "CUSTOM" ? txCustom.map((t) => LESEN_TYPE_LABELS[t] ?? t).join(" · ") : (LESEN_MIX_LABELS[txMix] ?? txMix)}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Difficulty</dt><dd>{DIRECTORY_LEVEL_LABELS[txLevel] ?? txLevel}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Text length</dt><dd>{LESEN_LENGTH_LABELS[txLength] ?? txLength}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Exercise sets</dt><dd>{count}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Import status</dt><dd>Draft</dd></div>
                                        </dl>
                                        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                            ℹ️ Hinweis: Kopieren Sie den Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool. Speichern Sie die generierte
                                            JSON-Ausgabe als Datei und laden Sie diese anschließend hier hoch. Prüfen Sie Texte, Antworten und Erklärungen vor der Veröffentlichung.
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                                            <li>Copy the prompt and paste it into an external AI tool.</li>
                                            <li>Save the AI&apos;s answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                                            <li>Upload the file on the <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">Import JSON</Link> page, check errors, warnings and the preview.</li>
                                            <li>Import it as a draft, edit if needed, and publish it only after you have solved all six questions from the texts yourself.</li>
                                        </ol>
                                    </div>
                                )}
                                {adSpec && (
                                    <div className="mt-3 space-y-3">
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-3">
                                            <div><dt className="text-xs text-gray-500">Main topic</dt><dd>{adTopicSel.length ? adTopicSel.map((t) => AD_TOPIC_LABELS[t] ?? t).join(", ") : "Random"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Categories</dt><dd>{adCats.length ? adCats.map((c) => AD_CATEGORY_LABELS[c] ?? c).join(", ") : "AI choice"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Difficulty</dt><dd>{DIRECTORY_LEVEL_LABELS[adLevel] ?? adLevel}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Exercise sets</dt><dd>{count}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Example</dt><dd>{adExample ? "Included" : "Not included"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Scenario variety</dt><dd>{DIRECTORY_VARIATION_LABELS[adVariation] ?? adVariation}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Import status</dt><dd>Draft</dd></div>
                                        </dl>
                                        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                            ℹ️ Hinweis: Kopieren Sie den Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool. Speichern Sie die generierte
                                            JSON-Ausgabe als Datei und importieren Sie sie anschließend hier. Die Erklärungen sind nur auf Deutsch. Prüfen Sie vor der Veröffentlichung, dass jede
                                            Situation genau eine passende Anzeige hat und die X-Situation keine.
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                                            <li>Copy the prompt and paste it into the AI tool.</li>
                                            <li>Save the AI&apos;s answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                                            <li>Upload the file on the <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">Import JSON</Link> page, check errors, warnings and the preview.</li>
                                            <li>Import it as a draft, edit if needed, and publish it only after you have solved the five situations yourself.</li>
                                        </ol>
                                    </div>
                                )}
                                {directorySpec && (
                                    <div className="mt-3 space-y-3">
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-3">
                                            <div><dt className="text-xs text-gray-500">Topic</dt><dd>{dirTopics.length ? dirTopics.map((t) => DIRECTORY_TOPIC_LABELS[t] ?? t).join(", ") : "Random"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Source type</dt><dd>{DIRECTORY_SOURCE_LABELS[dirSourceType] ?? dirSourceType}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Difficulty</dt><dd>{DIRECTORY_LEVEL_LABELS[dirLevel] ?? dirLevel}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Exercise sets</dt><dd>{count}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Example</dt><dd>{dirExample ? "Included" : "Not included"}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Variation</dt><dd>{DIRECTORY_VARIATION_LABELS[dirVariation] ?? dirVariation}</dd></div>
                                            <div><dt className="text-xs text-gray-500">Questions</dt><dd>21–25, 3 options each</dd></div>
                                        </dl>
                                        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                            ℹ️ Hinweis: Kopieren Sie den Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool. Speichern Sie die generierte
                                            JSON-Ausgabe als Datei und importieren Sie sie anschließend hier. Prüfen Sie den Inhalt vor der Veröffentlichung.
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                                            <li>Copy the prompt and paste it into the AI tool.</li>
                                            <li>Save the AI&apos;s answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                                            <li>Upload the file on the <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">Import JSON</Link> page, check errors, warnings and the preview.</li>
                                            <li>Import it as a draft, edit if needed, and publish it only after you have solved the five questions yourself.</li>
                                        </ol>
                                    </div>
                                )}
                                {spec?.taskType === "WRITING_TASK" && (
                                    <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                                        ℹ️ Hinweis: Kopieren Sie diesen Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool.
                                        Laden Sie anschließend die erzeugte JSON-Datei hier hoch. Importierte Aufgaben werden immer als Entwurf (DRAFT) gespeichert.
                                    </p>
                                )}
                                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                                    Paste the prompt into your AI, save its answer as a <code>.json</code> file (or copy the text), then{" "}
                                    <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">import it</Link>.
                                </p>
                            </>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                Configure the content on the left and generate a prompt. The prompt tells the AI to return only importable JSON,
                                and its numbering continues after the exercises you already have.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </ExamContentShell>
    );
}
