"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import { importExamContent, validateExamContent } from "@/services/adminExamContentService";
import { ExerciseReport, ImportResult, ValidationReport } from "@/types/examContent";
import { DtzOralPart } from "@/types/dtzOral";
import { ExerciseView, errorMessage, fieldClass } from "@/componenets/admin/examContent/shared";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

const partOf = (token: string | null | undefined) => Number.parseInt((token ?? "").replace(/\D/g, ""), 10) || null;

/**
 * Upload JSON → Validate → Preview → Import as DRAFT, for one Teil. A file for another Teil is flagged and cannot be imported here.
 * Imported exercises are always drafts; nothing is published by an import.
 */
export default function DtzOralImportPanel({ part, onImported }: Readonly<{ part: DtzOralPart; onImported: () => void }>) {
    const [json, setJson] = useState("");
    const [fileName, setFileName] = useState<string | null>(null);
    const [syntaxError, setSyntaxError] = useState<string | null>(null);
    const [report, setReport] = useState<ValidationReport | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [busy, setBusy] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const reset = () => {
        setReport(null);
        setResult(null);
        setSyntaxError(null);
    };

    const wrongPart = report?.part != null && partOf(report.part) !== part;

    const validate = async () => {
        reset();
        const quick = quickSyntaxCheck(json);
        if (quick) {
            setSyntaxError(quick);
            return;
        }
        setBusy(true);
        try {
            const res = await validateExamContent(json);
            setReport(res.data);
            if (!res.data.syntaxValid) setSyntaxError(res.data.issues[0]?.message ?? "Invalid JSON.");
        } catch (err) {
            toast.error(errorMessage(err, "Validation failed."));
        } finally {
            setBusy(false);
        }
    };

    const readFile = async (file: File | undefined) => {
        if (!file) return;
        reset();
        if (file.size > MAX_FILE_BYTES) {
            setSyntaxError("The file is larger than 5 MB.");
            return;
        }
        setFileName(file.name);
        setJson(await file.text());
    };

    const ready = (report?.exercises ?? []).filter((e) => e.state === "OK").map((e) => e.index);

    const doImport = async () => {
        setBusy(true);
        try {
            const res = await importExamContent(json, ready);
            setResult(res.data);
            if (res.data.imported.length > 0) {
                toast.success(`${res.data.imported.length} exercise${res.data.imported.length === 1 ? "" : "s"} imported as draft.`);
                onImported();
            }
        } catch (err) {
            toast.error(errorMessage(err, "Import failed."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <section aria-label="Upload JSON" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" aria-label="JSON file" onChange={(e) => readFile(e.target.files?.[0])} />
                <Button variant="secondary" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2"><FileUp className="size-4" />Upload JSON</Button>
                {fileName && <span className="text-sm text-gray-600 dark:text-gray-300">{fileName}</span>}
            </div>
            <textarea
                className={`${fieldClass} h-40 font-mono text-xs`}
                aria-label="JSON content"
                placeholder="...or paste the JSON returned by the AI here"
                value={json}
                onChange={(e) => { setJson(e.target.value); reset(); }}
            />
            <Button onClick={validate} disabled={busy || !json.trim()}>Validate</Button>

            {syntaxError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">{syntaxError}</p>}
            {wrongPart && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                    This file is for Teil {partOf(report?.part)}, not Teil {part}. Open that tab to import it.
                </p>
            )}

            {report && report.syntaxValid && (
                <div className="space-y-3">
                    <ul className="space-y-1" aria-label="Validation checks">
                        {report.checks.map((c) => (
                            <li key={c.label} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                                {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />}
                                {c.label}
                            </li>
                        ))}
                    </ul>
                    {report.issues.map((i, n) => <IssueLine key={`f${n}`} issue={i} />)}
                    {report.exercises.map((e) => <ExerciseResult key={e.index} report={e} />)}
                    <Button onClick={doImport} disabled={busy || wrongPart || ready.length === 0}>
                        Import as DRAFT{ready.length > 1 ? ` (${ready.length})` : ""}
                    </Button>
                    {ready.length === 0 && <p className="text-sm text-gray-500">Nothing is ready to import. Fix the errors above and validate again.</p>}
                </div>
            )}

            {result && (
                <div role="status" className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/40">
                    <p>{result.imported.length} imported as draft, {result.skipped.length} skipped.</p>
                    {result.skipped.map((s) => <p key={s.index} className="text-amber-700 dark:text-amber-300">{s.title ?? `Exercise ${s.index + 1}`}: {s.reason}</p>)}
                </div>
            )}
        </section>
    );
}

function IssueLine({ issue }: Readonly<{ issue: { severity: string; code: string; path: string; message: string } }>) {
    const error = issue.severity === "ERROR";
    return (
        <p className={`flex items-start gap-2 text-sm ${error ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
            {error ? <XCircle className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
            <span><span className="font-mono text-xs">{issue.path}</span> {issue.message}</span>
        </p>
    );
}

function ExerciseResult({ report }: Readonly<{ report: ExerciseReport }>) {
    return (
        <details className="rounded-lg border border-gray-200 p-3 dark:border-gray-700" open={report.state !== "OK"}>
            <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-white">
                {report.title ?? `Exercise ${report.index + 1}`} · {report.state}
            </summary>
            <div className="mt-3 space-y-2">
                {report.issues.map((i, n) => <IssueLine key={n} issue={i} />)}
                {report.preview && <div className="mt-3"><ExerciseView preview={report.preview} /></div>}
            </div>
        </details>
    );
}
