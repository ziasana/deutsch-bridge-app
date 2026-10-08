"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, FileUp, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { importExamContent, validateExamContent } from "@/services/adminExamContentService";
import { ExerciseReport, ExerciseReportState, ImportResult, ValidationReport } from "@/types/examContent";
import ExamContentShell from "./ExamContentShell";
import { cardClass, errorMessage, ExerciseView, fieldClass } from "./shared";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const STATE_LABELS: Record<ExerciseReportState, { label: string; className: string }> = {
    OK: { label: "Ready", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
    SIMILAR: { label: "Similar content", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
    EXACT_DUPLICATE: { label: "Duplicate", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
    EXTERNAL_ID_EXISTS: { label: "ID exists", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
    INVALID: { label: "Invalid", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
};

/** Fast, non-authoritative syntax feedback before the request; the backend validates everything again. */
function quickSyntaxCheck(text: string): string | null {
    if (!text.trim()) return "Nothing to validate - choose a file or paste the JSON.";
    if (text.includes("```")) return "Invalid JSON — remove Markdown code fences (```) so only the JSON object remains.";
    if (!text.trim().startsWith("{")) return "Invalid JSON — the text must start with '{'. Remove any introduction before the JSON.";
    try {
        JSON.parse(text);
        return null;
    } catch (err) {
        return `Invalid JSON: ${(err as Error).message}`;
    }
}

export default function ContentImport() {
    const [mode, setMode] = useState<"upload" | "paste">("upload");
    const [json, setJson] = useState("");
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [syntaxError, setSyntaxError] = useState<string | null>(null);
    const [report, setReport] = useState<ValidationReport | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const reset = () => {
        setReport(null);
        setResult(null);
        setSyntaxError(null);
        setSelected(new Set());
        setExpanded(new Set());
    };

    const validate = async (text: string) => {
        reset();
        const quick = quickSyntaxCheck(text);
        if (quick) {
            setSyntaxError(quick);
            return;
        }
        setBusy(true);
        try {
            const res = await validateExamContent(text);
            setReport(res.data);
            if (!res.data.syntaxValid) setSyntaxError(res.data.issues[0]?.message ?? "Invalid JSON.");
            // Pre-select everything that is ready; similar content must be opted into deliberately.
            setSelected(new Set(res.data.exercises.filter((e) => e.state === "OK").map((e) => e.index)));
            setExpanded(new Set(res.data.exercises.filter((e) => e.state !== "OK").slice(0, 3).map((e) => e.index)));
        } catch (err) {
            toast.error(errorMessage(err, "Validation failed."));
        } finally {
            setBusy(false);
        }
    };

    const readFile = async (file: File | undefined) => {
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            toast.error("The file is larger than 5 MB.");
            return;
        }
        if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
            toast.error("Please choose a .json file.");
            return;
        }
        const text = await file.text();
        setFileName(file.name);
        setJson(text);
        await validate(text);
    };

    const toggle = (set: Set<number>, index: number) => {
        const next = new Set(set);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
    };

    const runImport = async () => {
        setBusy(true);
        try {
            const res = await importExamContent(json, [...selected].sort((a, b) => a - b));
            setResult(res.data);
            toast.success(`${res.data.imported.length} exercise${res.data.imported.length === 1 ? "" : "s"} imported as draft.`);
        } catch (err) {
            toast.error(errorMessage(err, "Import failed."));
        } finally {
            setBusy(false);
        }
    };

    const importableSelected = report ? report.exercises.filter((e) => e.importable && selected.has(e.index)).length : 0;

    return (
        <ExamContentShell
            title="Import JSON"
            description="Upload or paste the JSON an AI generated. Everything is validated first; nothing is published automatically - imported exercises start as drafts."
        >
            <div className={`${cardClass} p-6`}>
                <div className="flex gap-2 mb-4" role="tablist">
                    {(["upload", "paste"] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            role="tab"
                            aria-selected={mode === m}
                            onClick={() => setMode(m)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === m ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
                        >
                            {m === "upload" ? "Upload JSON" : "Paste JSON"}
                        </button>
                    ))}
                </div>

                {mode === "upload" ? (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); void readFile(e.dataTransfer.files[0]); }}
                        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600"}`}
                    >
                        <FileUp className="size-8 text-gray-400" />
                        <p className="text-gray-700 dark:text-gray-200">Drag a JSON file here, or</p>
                        <Button type="button" onClick={() => fileInput.current?.click()}>Choose JSON file</Button>
                        <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
                        {fileName && <p className="text-sm text-gray-500 dark:text-gray-400">Loaded: {fileName}</p>}
                    </div>
                ) : (
                    <div>
                        <textarea
                            aria-label="JSON to import"
                            className={`${fieldClass} h-72 font-mono text-xs`}
                            value={json}
                            onChange={(e) => { setJson(e.target.value); setFileName(null); }}
                            placeholder={'{\n  "schemaVersion": "1.0",\n  "contentType": "EXAM_EXERCISE_BATCH",\n  ...\n}'}
                            spellCheck={false}
                        />
                        <div className="mt-3">
                            <Button type="button" disabled={busy} onClick={() => validate(json)}>Validate</Button>
                        </div>
                    </div>
                )}

                {syntaxError && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
                        <XCircle className="size-5 shrink-0" /> <span>{syntaxError}</span>
                    </div>
                )}
            </div>

            {report?.syntaxValid && (
                <div className={`${cardClass} p-6 mt-6`}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Validation result</h2>
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {report.checks.map((c) => (
                            <li key={c.label} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                                {c.ok ? <CheckCircle2 className="size-4 text-green-600" /> : <XCircle className="size-4 text-red-600" />} {c.label}
                            </li>
                        ))}
                    </ul>

                    {report.issues.length > 0 && (
                        <ul className="mt-4 space-y-1.5">
                            {report.issues.map((i, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <XCircle className="size-4 mt-0.5 shrink-0" /> {i.message}
                                </li>
                            ))}
                        </ul>
                    )}

                    {report.exercises.length > 0 && (
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                            {report.importableCount} of {report.exerciseCount} exercise{report.exerciseCount === 1 ? "" : "s"} can be imported
                            {report.similarCount > 0 && ` · ${report.similarCount} with similar existing content`}
                            {report.duplicateCount > 0 && ` · ${report.duplicateCount} duplicate${report.duplicateCount === 1 ? "" : "s"} (skipped)`}.
                        </p>
                    )}

                    <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                        {report.exercises.map((ex) => (
                            <ExerciseRow
                                key={ex.index}
                                exercise={ex}
                                checked={selected.has(ex.index)}
                                open={expanded.has(ex.index)}
                                onCheck={() => setSelected((s) => toggle(s, ex.index))}
                                onOpen={() => setExpanded((s) => toggle(s, ex.index))}
                            />
                        ))}
                    </ul>

                    {!result && report.exercises.length > 0 && (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Button disabled={busy || importableSelected === 0} onClick={runImport}>
                                Import {importableSelected} as draft
                            </Button>
                            <Button variant="secondary" onClick={() => setSelected(new Set(report.exercises.filter((e) => e.state === "OK").map((e) => e.index)))}>
                                Select all ready
                            </Button>
                            {!report.valid && <span className="text-sm text-gray-500 dark:text-gray-400">Exercises with errors are skipped.</span>}
                        </div>
                    )}

                    {result && (
                        <div className="mt-5 rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-900 dark:text-green-100">
                            <p className="font-semibold">{result.imported.length} imported as draft, {result.skipped.length} skipped.</p>
                            {result.skipped.length > 0 && (
                                <ul className="mt-2 list-disc pl-5">
                                    {result.skipped.map((s) => <li key={s.index}>{s.externalId ?? s.title ?? `#${s.index + 1}`}: {s.reason}</li>)}
                                </ul>
                            )}
                            <Link href="/admin/exam-prep/content-library" className="mt-3 inline-block underline font-semibold">Review the drafts in the Content Library →</Link>
                        </div>
                    )}
                </div>
            )}

            {busy && <Loading message="Please wait..." />}
        </ExamContentShell>
    );
}

interface ExerciseRowProps {
    exercise: ExerciseReport;
    checked: boolean;
    open: boolean;
    onCheck: () => void;
    onOpen: () => void;
}

function ExerciseRow({ exercise, checked, open, onCheck, onOpen }: Readonly<ExerciseRowProps>) {
    const state = STATE_LABELS[exercise.state];
    const errors = exercise.issues.filter((i) => i.severity === "ERROR");
    const warnings = exercise.issues.filter((i) => i.severity === "WARNING");
    return (
        <li className="p-3">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    aria-label={`Select ${exercise.title ?? `exercise ${exercise.index + 1}`}`}
                    checked={checked}
                    disabled={!exercise.importable}
                    onChange={onCheck}
                    className="size-4"
                />
                <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-2 text-left min-w-0" aria-expanded={open}>
                    {open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 shrink-0">{exercise.externalId ?? `#${exercise.index + 1}`}</span>
                    <span className="truncate text-gray-900 dark:text-white">{exercise.title ?? "(no title)"}</span>
                </button>
                {warnings.length > 0 && exercise.state === "OK" && (
                    <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><AlertTriangle className="size-3.5" />{warnings.length}</span>
                )}
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${state.className}`}>{state.label}</span>
            </div>

            {exercise.state === "SIMILAR" && !checked && (
                <p className="ml-7 mt-1 text-xs text-amber-700 dark:text-amber-300">Tick the box to import anyway after comparing below.</p>
            )}

            {open && (
                <div className="ml-7 mt-3 space-y-4">
                    {errors.length > 0 && (
                        <ul className="space-y-1">
                            {errors.map((i, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-red-700 dark:text-red-300"><XCircle className="size-4 mt-0.5 shrink-0" />{i.message}</li>
                            ))}
                        </ul>
                    )}
                    {warnings.length > 0 && (
                        <ul className="space-y-1">
                            {warnings.map((i, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-amber-700 dark:text-amber-300"><AlertTriangle className="size-4 mt-0.5 shrink-0" />{i.message}</li>
                            ))}
                        </ul>
                    )}
                    {exercise.duplicates.map((d, idx) => (
                        <div key={idx} className="rounded-lg border border-amber-300 dark:border-amber-700 p-3 text-sm">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {d.kind === "EXTERNAL_ID" && `An exercise with externalId ${d.existingExternalId} already exists.`}
                                {d.kind.endsWith("EXACT") && `Identical texts already ${d.kind.startsWith("BATCH") ? "appear earlier in this file" : "exist"}${d.existingTitle ? `: ${d.existingTitle}` : ""}.`}
                                {d.kind.endsWith("SIMILAR") && `Similarity ${Math.round(d.similarity * 100)}% with ${d.kind.startsWith("BATCH") ? "an earlier exercise in this file" : (d.existingExternalId ?? d.existingTitle ?? "an existing exercise")}`}
                            </p>
                            {d.kind.endsWith("SIMILAR") && (
                                <div className="mt-2 grid gap-3 md:grid-cols-2">
                                    <blockquote className="rounded bg-gray-50 dark:bg-gray-900/40 p-2 text-gray-800 dark:text-gray-200"><span className="block text-xs text-gray-500">New</span>{d.newText}</blockquote>
                                    <blockquote className="rounded bg-gray-50 dark:bg-gray-900/40 p-2 text-gray-800 dark:text-gray-200"><span className="block text-xs text-gray-500">Existing</span>{d.existingText}</blockquote>
                                </div>
                            )}
                        </div>
                    ))}
                    <details>
                        <summary className="cursor-pointer text-sm font-semibold text-blue-700 dark:text-blue-300">View preview</summary>
                        <div className="mt-3"><ExerciseView preview={exercise.preview} /></div>
                    </details>
                </div>
            )}
        </li>
    );
}
