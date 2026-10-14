"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { generateExamContentPrompt } from "@/services/adminExamContentService";
import { PromptResponse } from "@/types/examContent";
import { DTZ_ORAL_LEVELS, DtzOralPart, PHOTO_TOPICS, PLANNING_TOPICS } from "@/types/dtzOral";
import { copyText, errorMessage, fieldClass, labelClass } from "@/componenets/admin/examContent/shared";

const HINTS: Record<DtzOralPart, string> = {
    1: "Teil 1 is a fixed template: the six topics are never regenerated. The prompt only asks an AI to return the standard template in the import format.",
    2: "The AI writes the topic, the image prompt and the questions. It cannot deliver the photo: generate or upload the picture separately, attach it in the editor and only then publish.",
    3: "The AI writes a shared situation, the fixed instruction and four to six planning notes that fit it.",
};

/**
 * The AI content-generation prompt of one Teil. Each Teil has its own prompt (the three formats differ); the settings only guide the content.
 * Nothing is generated at runtime - the administrator copies the prompt into an external AI tool and imports the JSON it returns.
 */
export default function DtzOralPromptPanel({ part }: Readonly<{ part: DtzOralPart }>) {
    const [topics, setTopics] = useState<string[]>([]);
    const [custom, setCustom] = useState("");
    const [level, setLevel] = useState("A2_B1");
    const [count, setCount] = useState("1");
    const [notes, setNotes] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<PromptResponse | null>(null);
    const [copied, setCopied] = useState(false);

    const suggestions = part === 2 ? PHOTO_TOPICS : PLANNING_TOPICS;
    const toggle = (topic: string) => setTopics((t) => (t.includes(topic) ? t.filter((x) => x !== topic) : [...t, topic]));
    const addCustom = () => {
        const topic = custom.trim();
        if (topic && !topics.includes(topic)) setTopics([...topics, topic]);
        setCustom("");
    };

    const generate = async () => {
        setBusy(true);
        setCopied(false);
        try {
            const res = await generateExamContentPrompt({
                exam: "DTZ",
                level: "A2_B1",
                section: "MUENDLICH",
                part: `TEIL_${part}`,
                count: part === 1 ? 1 : Math.min(50, Math.max(1, Number.parseInt(count, 10) || 1)),
                difficulty: level,
                topics: part === 1 ? [] : topics,
                notes: notes.trim() || undefined,
            });
            setResult(res.data);
        } catch (err) {
            toast.error(errorMessage(err, "Could not generate the prompt."));
        } finally {
            setBusy(false);
        }
    };

    const copy = async () => {
        if (!result) return;
        if (await copyText(result.prompt)) {
            setCopied(true);
            toast.success("Prompt copied.");
        } else {
            toast.error("Could not copy - select the text and copy it by hand.");
        }
    };

    return (
        <section aria-label="AI Content Generation Prompt" className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">{HINTS[part]}</p>
            {part !== 1 && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label>
                            <span className={labelClass}>Difficulty</span>
                            <select className={fieldClass} value={level} onChange={(e) => setLevel(e.target.value)}>
                                {DTZ_ORAL_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className={labelClass}>Number of exercises</span>
                            <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} />
                        </label>
                    </div>
                    <fieldset>
                        <legend className={labelClass}>{part === 2 ? "Topic category" : "Scenario"} {topics.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {[...suggestions, ...topics.filter((t) => !suggestions.includes(t))].map((topic) => (
                                <button
                                    key={topic}
                                    type="button"
                                    aria-pressed={topics.includes(topic)}
                                    onClick={() => toggle(topic)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${topics.includes(topic) ? "border-primary bg-primary text-primary-foreground" : "border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"}`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <input
                                className={fieldClass}
                                aria-label="Custom topic"
                                placeholder="Add your own topic..."
                                value={custom}
                                maxLength={80}
                                onChange={(e) => setCustom(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                            />
                            <Button variant="secondary" onClick={addCustom} disabled={!custom.trim()}>Add</Button>
                        </div>
                    </fieldset>
                    <label className="block">
                        <span className={labelClass}>Additional instructions (optional)</span>
                        <textarea className={`${fieldClass} min-h-[60px]`} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
                    </label>
                </div>
            )}
            <Button onClick={generate} disabled={busy} className="inline-flex items-center gap-2">
                <Sparkles className="size-4" />{busy ? "Generating..." : "Generate prompt"}
            </Button>

            {result && (
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Content Generation Prompt · Teil {part}</h3>
                        <Button variant="secondary" onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                            {copied ? <Check className="size-3.5" /> : <ClipboardCopy className="size-3.5" />}{copied ? "Copied" : "Copy Prompt"}
                        </Button>
                    </div>
                    <textarea readOnly aria-label="Generated prompt" className={`${fieldClass} mt-2 h-64 font-mono text-xs`} value={result.prompt} />
                    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                        <li>Copy the prompt and paste it into an external AI tool.</li>
                        <li>Save the answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                        <li>Upload it under “Upload JSON” below, check errors and warnings and import it as a draft.</li>
                        {part === 2 && <li>Make or upload the photo from the image prompt, attach it in the editor and check the preview before publishing.</li>}
                    </ol>
                </div>
            )}
        </section>
    );
}
