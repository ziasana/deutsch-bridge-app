"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Plus, Trash2, X, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { createDtzOral, updateDtzOral, validateExamContent } from "@/services/adminExamContentService";
import { getExamExerciseForAdmin, uploadExamPassageImage } from "@/services/adminExamService";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { ValidationReport } from "@/types/examContent";
import {
    DTZ_ORAL_LEVELS, DTZ_ORAL_PARTS, DtzOralPart, MAX_NOTES, MAX_SOLUTION_TURNS, MIN_NOTES, MIN_SOLUTION_TURNS, PARTICIPANT_A_INSTRUCTIONS, PARTICIPANT_B_INSTRUCTIONS, PHOTO_TOPICS, PICTURE_PROMPTS,
    PLANNING_TOPICS, QUESTIONS_PER_LEVEL, TASK_INSTRUCTION, TEIL1_TOPICS,
} from "@/types/dtzOral";
import { errorMessage, fieldClass, labelClass } from "@/componenets/admin/examContent/shared";
import DtzOralExercise from "@/componenets/exam/dtzOral/DtzOralExercise";
import {
    OralDraft, PracticeForm, Teil2Form, Teil3Form, draftFromStored, emptyDraft, localProblems, previewContent, toBody, toImportJson,
} from "./dtzOralForm";

interface Props {
    part: DtzOralPart;
    /** The exercise to edit; omitted = create a new draft by hand. */
    exerciseId?: string | null;
    onClose: () => void;
    /** Called after a successful save with the exercise id. */
    onSaved: (id: string) => void;
}

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Editor of one DTZ Mündliche Prüfung exercise. Each Teil has its own form: Teil 1 the fixed template (topics cannot change, the practice support
 * can), Teil 2 the photo with both question sets, Teil 3 the situation and the planning notes. "Validate" runs the same checks as an import on
 * the current content; "Save as Draft" stores it (the backend checks again). A Teil 2 exercise cannot be published until a photo is attached.
 */
export default function DtzOralEditor({ part, exerciseId, onClose, onSaved }: Readonly<Props>) {
    const [draft, setDraft] = useState<OralDraft>(() => emptyDraft(part));
    const [loading, setLoading] = useState(!!exerciseId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<ValidationReport | null>(null);
    const [validating, setValidating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const meta = DTZ_ORAL_PARTS.find((p) => p.part === part)!;

    useEffect(() => {
        if (!exerciseId) return;
        let cancelled = false;
        getExamExerciseForAdmin(exerciseId)
            .then((res) => { if (!cancelled) setDraft(draftFromStored(part, res.data.title, res.data.metadata)); })
            .catch((err) => { if (!cancelled) setError(errorMessage(err, "Could not load the exercise.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [exerciseId, part]);

    const change = (patch: Partial<OralDraft>) => { setDraft((d) => ({ ...d, ...patch })); setReport(null); };
    const changeT2 = (patch: Partial<Teil2Form>) => change({ t2: { ...draft.t2, ...patch } });
    const changeT3 = (patch: Partial<Teil3Form>) => change({ t3: { ...draft.t3, ...patch } });

    const validate = async () => {
        const problems = localProblems(draft);
        setError(problems.length ? problems.join(" ") : null);
        setValidating(true);
        try {
            const res = await validateExamContent(JSON.stringify(toImportJson(draft)));
            setReport(res.data);
        } catch (err) {
            setError(errorMessage(err, "Validation failed."));
        } finally {
            setValidating(false);
        }
    };

    const save = async () => {
        const problems = localProblems(draft);
        setError(problems.length ? problems.join(" ") : null);
        if (problems.length) return;
        setSaving(true);
        try {
            const res = exerciseId ? await updateDtzOral(exerciseId, toBody(draft)) : await createDtzOral(toBody(draft));
            toast.success(exerciseId ? "Exercise saved." : "Exercise saved as draft.");
            res.data.warnings.forEach((w) => toast.error(`Check: ${w.message}`));
            onSaved(res.data.id);
        } catch (err) {
            setError(errorMessage(err, "Could not save the exercise."));
        } finally {
            setSaving(false);
        }
    };

    const issues = report?.exercises[0]?.issues ?? [];
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`${exerciseId ? "Edit" : "Create"} ${meta.label} exercise`}>
            <div className="my-8 w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{exerciseId ? "Edit exercise" : "Create exercise"} · {meta.label} — {meta.title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close editor" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="size-5" /></button>
                </div>
                {loading ? (
                    <Loading message="Loading..." />
                ) : (
                    <div className="mt-4 space-y-5">
                        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                            <label className="block">
                                <span className={labelClass}>Title</span>
                                <input className={fieldClass} value={draft.title} maxLength={200} onChange={(e) => change({ title: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={labelClass}>Difficulty</span>
                                <select className={fieldClass} value={draft.level} onChange={(e) => change({ level: e.target.value })}>
                                    {DTZ_ORAL_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </label>
                        </div>

                        {part === 1 && <Teil1Editor draft={draft} change={change} />}
                        {part === 2 && <Teil2Editor form={draft.t2} change={changeT2} />}
                        {part === 3 && <Teil3Editor form={draft.t3} change={changeT3} />}

                        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">{error}</p>}

                        <section aria-label="Validation status" className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">JSON preview and validation</h3>
                                <Button variant="secondary" className="ms-auto px-3 py-1.5 text-xs" onClick={validate} disabled={validating}>{validating ? "Validating..." : "Validate"}</Button>
                                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setShowPreview((v) => !v)}>{showPreview ? "Hide preview" : "Preview"}</Button>
                            </div>
                            {report && (
                                <div role="status" className="space-y-1">
                                    <p className={`text-sm font-semibold ${report.valid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                                        {report.valid ? "Valid — ready to save" : "Not valid — fix the errors before saving"}
                                    </p>
                                    {report.checks.map((c) => (
                                        <p key={c.label} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                                            {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />}{c.label}
                                        </p>
                                    ))}
                                    {issues.map((i, n) => (
                                        <p key={n} className={`text-sm ${i.severity === "ERROR" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                                            {i.severity === "ERROR" ? "Error" : "Warning"}: {i.message}
                                        </p>
                                    ))}
                                </div>
                            )}
                            <details>
                                <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300">Show JSON</summary>
                                <pre aria-label="JSON preview" className="mt-2 max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(toImportJson(draft), null, 2)}</pre>
                            </details>
                            {showPreview && (
                                <div className="mt-3 rounded-xl bg-background p-4 text-foreground">
                                    <DtzOralExercise
                                        title={draft.title || "(no title)"}
                                        content={previewContent(draft)}
                                        adminImagePrompt={part === 2 ? draft.t2.imagePrompt : null}
                                    />
                                </div>
                            )}
                        </section>

                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button disabled={saving} onClick={save}>{saving ? "Saving..." : exerciseId ? "Save changes" : "Save as Draft"}</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------ Teil 1

function Teil1Editor({ draft, change }: Readonly<{ draft: OralDraft; change: (patch: Partial<OralDraft>) => void }>) {
    const t = draft.t1;
    const set = (patch: Partial<typeof t>) => change({ t1: { ...t, ...patch } });
    const setPractice = (i: number, patch: Partial<PracticeForm>) => set({ practice: t.practice.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
    return (
        <div className="space-y-4">
            <label className="block">
                <span className={labelClass}>Exam instructions</span>
                <textarea className={`${fieldClass} min-h-[60px]`} value={t.instructions} maxLength={600} onChange={(e) => set({ instructions: e.target.value })} />
            </label>
            <fieldset className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Fixed topics (cannot be changed)</legend>
                <ol className="grid gap-2 sm:grid-cols-3" aria-label="Fixed topics">
                    {TEIL1_TOPICS.map((label, i) => (
                        <li key={label} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/50"><span className="font-bold">{i + 1}</span>{label}</li>
                    ))}
                </ol>
            </fieldset>
            <label className="block">
                <span className={labelClass}>Short guidance for learners (optional)</span>
                <textarea className={`${fieldClass} min-h-[60px]`} value={t.guidance} maxLength={600} onChange={(e) => set({ guidance: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className={labelClass}>Explanation in English (optional)</span>
                    <textarea className={`${fieldClass} min-h-[60px]`} value={t.en} maxLength={600} onChange={(e) => set({ en: e.target.value })} />
                </label>
                <label className="block">
                    <span className={labelClass}>Explanation in Persian (optional)</span>
                    <textarea dir="rtl" className={`${fieldClass} min-h-[60px]`} value={t.fa} maxLength={600} onChange={(e) => set({ fa: e.target.value })} />
                </label>
            </div>
            <section aria-label="Practice support" className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Practice support (optional, kept apart from the examination topics)</h3>
                {t.practice.map((p, i) => (
                    <details key={TEIL1_TOPICS[i]} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <summary className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white">{i + 1}. {TEIL1_TOPICS[i]}</summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className={labelClass}>{TEIL1_TOPICS[i]} · simple question</span>
                                <input className={fieldClass} value={p.question} maxLength={300} onChange={(e) => setPractice(i, { question: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={labelClass}>{TEIL1_TOPICS[i]} · sentence starter</span>
                                <input className={fieldClass} value={p.sentenceStarter} maxLength={300} onChange={(e) => setPractice(i, { sentenceStarter: e.target.value })} />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className={labelClass}>{TEIL1_TOPICS[i]} · useful vocabulary (one per line)</span>
                                <textarea className={`${fieldClass} min-h-[70px]`} value={p.vocabularyText} onChange={(e) => setPractice(i, { vocabularyText: e.target.value })} />
                            </label>
                        </div>
                    </details>
                ))}
            </section>
        </div>
    );
}

// ------------------------------------------------------------------ Teil 2

function Teil2Editor({ form, change }: Readonly<{ form: Teil2Form; change: (patch: Partial<Teil2Form>) => void }>) {
    const input = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const src = resolveUploadUrl(form.imageUrl);

    const upload = async (file: File | undefined) => {
        if (!file) return;
        setUploadError(null);
        if (!ACCEPTED_IMAGES.split(",").includes(file.type)) {
            setUploadError("Only JPEG, PNG or WebP images can be used.");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setUploadError("The image is larger than 8 MB.");
            return;
        }
        setUploading(true);
        try {
            const res = await uploadExamPassageImage(file);
            change({ imageUrl: res.data.url });
        } catch (err) {
            setUploadError(errorMessage(err, "The image could not be uploaded."));
        } finally {
            setUploading(false);
            if (input.current) input.current.value = "";
        }
    };
    const setQuestion = (key: "questionsA2" | "questionsB1", i: number, value: string) => change({ [key]: form[key].map((q, j) => (j === i ? value : q)) });

    return (
        <div className="space-y-5">
            <label className="block">
                <span className={labelClass}>Topic</span>
                <input className={fieldClass} list="dtz-photo-topics" value={form.topic} maxLength={200} onChange={(e) => change({ topic: e.target.value })} />
                <datalist id="dtz-photo-topics">{PHOTO_TOPICS.map((t) => <option key={t} value={t} />)}</datalist>
            </label>

            <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Photo</legend>
                <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
                    <div>
                        {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt={form.altText || "Uploaded photo"} className="aspect-[4/3] w-full rounded-lg object-cover" />
                        ) : (
                            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-600">No image attached</div>
                        )}
                        <p className={`mt-2 text-xs font-semibold ${form.imageUrl ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>
                            {form.imageUrl ? "Image attached" : "Cannot be published without an image"}
                        </p>
                        <input ref={input} type="file" accept={ACCEPTED_IMAGES} className="sr-only" aria-label="Photo file" onChange={(e) => upload(e.target.files?.[0])} />
                        <div className="mt-2 flex gap-2">
                            <Button variant="secondary" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" disabled={uploading} onClick={() => input.current?.click()}>
                                <ImagePlus className="size-3.5" />{uploading ? "Uploading..." : form.imageUrl ? "Replace image" : "Upload image"}
                            </Button>
                            {form.imageUrl && <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => change({ imageUrl: null })}>Remove</Button>}
                        </div>
                        {uploadError && <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">{uploadError}</p>}
                    </div>
                    <div className="space-y-3">
                        <label className="block">
                            <span className={labelClass}>Image prompt (for the original photo)</span>
                            <textarea className={`${fieldClass} min-h-[96px]`} value={form.imagePrompt} maxLength={3000} onChange={(e) => change({ imagePrompt: e.target.value })} />
                        </label>
                        <label className="block">
                            <span className={labelClass}>Alt text (German)</span>
                            <input className={fieldClass} value={form.altText} maxLength={600} onChange={(e) => change({ altText: e.target.value })} />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            The photo must show an everyday situation with people, actions and objects, no readable text, no logos or watermarks, and must not be an official exam photograph unless the usage rights are confirmed.
                            A placeholder link is not accepted: upload the real image.
                        </p>
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Participant A · Bildbeschreibung (fixed)</legend>
                <p className="text-sm text-gray-700 dark:text-gray-200">{PARTICIPANT_A_INSTRUCTIONS}</p>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200">{PICTURE_PROMPTS.map((q) => <li key={q}>{q}</li>)}</ul>
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Participant B · Eigene Erfahrungen</legend>
                <p className="text-sm text-gray-700 dark:text-gray-200">{PARTICIPANT_B_INSTRUCTIONS}</p>
                <div className="grid gap-4 lg:grid-cols-2">
                    {([["questionsA2", "A2"], ["questionsB1", "B1"]] as const).map(([key, level]) => (
                        <div key={key} className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-gray-500">{level} questions ({QUESTIONS_PER_LEVEL})</p>
                            {form[key].map((q, i) => (
                                <label key={i} className="block">
                                    <span className="sr-only">{level} question {i + 1}</span>
                                    <input className={fieldClass} aria-label={`${level} question ${i + 1}`} value={q} maxLength={300} onChange={(e) => setQuestion(key, i, e.target.value)} />
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Mögliche Lösung (optional, revealed to learners on request)</legend>
                <p className="text-xs text-gray-500 dark:text-gray-400">One possible answer in spoken A2–B1 German. It is an example, not the only correct answer, and must only describe what the photo can show.</p>
                <label className="block">
                    <span className={labelClass}>Possible solution · picture description (A)</span>
                    <textarea className={`${fieldClass} min-h-[84px]`} value={form.solutionDescription} maxLength={1500} onChange={(e) => change({ solutionDescription: e.target.value })} />
                </label>
                <div className="grid gap-3 lg:grid-cols-2">
                    <label className="block">
                        <span className={labelClass}>Possible solution · experiences A2 (B)</span>
                        <textarea className={`${fieldClass} min-h-[84px]`} value={form.solutionA2} maxLength={1500} onChange={(e) => change({ solutionA2: e.target.value })} />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Possible solution · experiences B1 (B)</span>
                        <textarea className={`${fieldClass} min-h-[84px]`} value={form.solutionB1} maxLength={1500} onChange={(e) => change({ solutionB1: e.target.value })} />
                    </label>
                </div>
            </fieldset>
        </div>
    );
}

// ------------------------------------------------------------------ Teil 3

function Teil3Editor({ form, change }: Readonly<{ form: Teil3Form; change: (patch: Partial<Teil3Form>) => void }>) {
    const setNote = (i: number, value: string) => change({ notes: form.notes.map((n, j) => (j === i ? value : n)) });
    return (
        <div className="space-y-4">
            <label className="block">
                <span className={labelClass}>Topic</span>
                <input className={fieldClass} list="dtz-planning-topics" value={form.topic} maxLength={200} onChange={(e) => change({ topic: e.target.value })} />
                <datalist id="dtz-planning-topics">{PLANNING_TOPICS.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            <label className="block">
                <span className={labelClass}>Situation</span>
                <textarea className={`${fieldClass} min-h-[84px]`} value={form.situation} maxLength={700} onChange={(e) => change({ situation: e.target.value })} />
            </label>
            <div>
                <span className={labelClass}>Task instruction (fixed)</span>
                <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/50">{TASK_INSTRUCTION}</p>
            </div>
            <fieldset className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Planning notes ({MIN_NOTES}–{MAX_NOTES})</legend>
                {form.notes.map((note, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-6 text-sm font-bold text-gray-500">{i + 1}</span>
                        <input className={fieldClass} aria-label={`Planning note ${i + 1}`} value={note} maxLength={80} onChange={(e) => setNote(i, e.target.value)} />
                        <button
                            type="button"
                            aria-label={`Remove note ${i + 1}`}
                            disabled={form.notes.length <= MIN_NOTES}
                            onClick={() => change({ notes: form.notes.filter((_, j) => j !== i) })}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ))}
                <Button variant="secondary" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" disabled={form.notes.length >= MAX_NOTES} onClick={() => change({ notes: [...form.notes, ""] })}>
                    <Plus className="size-3.5" />Add note
                </Button>
            </fieldset>
            <label className="block">
                <span className={labelClass}>Example phrases for learners (optional, one per line — separate from the task)</span>
                <textarea className={`${fieldClass} min-h-[70px]`} value={form.phrasesText} onChange={(e) => change({ phrasesText: e.target.value })} />
            </label>
            <label className="block">
                <span className={labelClass}>Mögliche Lösung — sample conversation (optional, one turn per line starting with A: or B:)</span>
                <textarea
                    className={`${fieldClass} min-h-[140px] font-mono text-xs`}
                    placeholder={"A: Wann wollen wir das Fest machen?\nB: Ich schlage Freitag vor. Was meinst du?"}
                    value={form.solutionText}
                    onChange={(e) => change({ solutionText: e.target.value })}
                />
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Shown to learners on request, apart from the task. {MIN_SOLUTION_TURNS}–{MAX_SOLUTION_TURNS} turns; it is one possible plan, not the only correct one.</span>
            </label>
        </div>
    );
}
