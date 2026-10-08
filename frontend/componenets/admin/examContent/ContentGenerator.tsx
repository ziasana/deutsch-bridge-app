"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Check, ClipboardCopy, Download, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { generateExamContentPrompt, getExamContentOptions } from "@/services/adminExamContentService";
import { PromptResponse } from "@/types/examContent";
import ExamContentShell from "./ExamContentShell";
import { cardClass, copyText, downloadTextFile, errorMessage, fieldClass, labelClass } from "./shared";

const EXAM_LABELS: Record<string, string> = { TELC: "Telc", GOETHE: "Goethe", TESTDAF: "TestDaF", DSH: "DSH", OTHER: "Other" };
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DIFFICULTY_LABELS: Record<string, string> = { MIXED: "Mixed (20% easy · 60% medium · 20% hard)", EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };
const topicLabel = (topic: string) => topic.charAt(0) + topic.slice(1).toLowerCase().replaceAll("_", " ");

/** Builds the copy-paste prompt for any external AI; the backend never calls an AI itself. */
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
    const [result, setResult] = useState<PromptResponse | null>(null);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const sections = useMemo(() => [...new Map((options?.specs ?? []).map((s) => [s.section, s.sectionLabel])).entries()], [options]);
    const parts = useMemo(() => [...new Set((options?.specs ?? []).filter((s) => s.section === section).map((s) => s.part))], [options, section]);
    const spec = options?.specs.find((s) => s.exam === exam && s.level === level && s.section === section && s.part === part);

    const toggleTopic = (topic: string) => setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));

    const generate = async (e: React.FormEvent) => {
        e.preventDefault();
        const n = Number(count);
        if (!Number.isInteger(n) || n < 1 || n > 50) {
            toast.error("Number of exercise sets must be between 1 and 50.");
            return;
        }
        setGenerating(true);
        try {
            const res = await generateExamContentPrompt({ exam, level, section, part, count: n, difficulty, topics, notes: notes.trim() || undefined });
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
                                {spec.taskType === "MULTIPLE_CHOICE"
                                    ? `✓ ${spec.label}: one reading text, ${spec.questionCount} questions with ${spec.optionCount} options each.`
                                    : `✓ ${spec.label}: ${spec.textCount} texts, ${spec.headingCount} headings (${spec.headingCount - spec.textCount} unused).`}
                            </p>
                        ) : (
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                No content specification exists for this combination yet. Available:{" "}
                                {(options?.specs ?? []).map((s) => s.label).join("; ") || "none"}.
                            </p>
                        )}

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
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI generation prompt</h2>
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
