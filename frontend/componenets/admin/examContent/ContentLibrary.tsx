"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Pencil, X } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import useAuthStore from "@/store/useAuthStore";
import { getExamExerciseForAdmin, getExamExercisesForAdmin } from "@/services/adminExamService";
import { changeExamContentStatus, downloadExamContentExport } from "@/services/adminExamContentService";
import { ExamExerciseAdminRow, ExamExerciseResponse, ExamSection } from "@/types/exam";
import { EXAM_CONTENT_STATUSES, ExamContentStatus, ExercisePreviewData, PreviewAdvertisement, PreviewSituation } from "@/types/examContent";
import ExamContentShell from "./ExamContentShell";
import { cardClass, errorMessage, ExerciseView, fieldClass, htmlToText, labelClass, StatusBadge } from "./shared";

const PAGE_SIZE = 15;
const EXAM_LABELS: Record<string, string> = { TELC: "Telc", GOETHE: "Goethe", TESTDAF: "TestDaF", DSH: "DSH", OTHER: "Other" };
const SECTION_PATHS: Record<ExamSection, string> = {
    LESEVERSTEHEN: "leseverstehen",
    SPRACHBAUSTEINE: "sprachbausteine",
    HOERVERSTEHEN: "hoerverstehen",
    SCHRIFTLICHER_AUSDRUCK: "schriftlicher-ausdruck",
    TESTFORMAT_INFORMATION: "testformat-information",
};
const SECTION_LABELS: Record<ExamSection, string> = {
    LESEVERSTEHEN: "Lesen",
    SPRACHBAUSTEINE: "Sprachbausteine",
    HOERVERSTEHEN: "Hören",
    SCHRIFTLICHER_AUSDRUCK: "Schreiben",
    TESTFORMAT_INFORMATION: "Testformat",
};

/** The status each button moves the selection to - the backend enforces which moves are actually legal. */
const BULK_ACTIONS: { label: string; status: ExamContentStatus }[] = [
    { label: "Send to review", status: "REVIEW" },
    { label: "Approve", status: "APPROVED" },
    { label: "Publish", status: "PUBLISHED" },
    { label: "Unpublish (back to draft)", status: "DRAFT" },
    { label: "Reject", status: "REJECTED" },
    { label: "Archive", status: "ARCHIVED" },
];

interface Filters {
    examType: string;
    level: string;
    section: string;
    partNumber: string;
    status: string;
    search: string;
}
const emptyFilters: Filters = { examType: "", level: "", section: "", partNumber: "", status: "", search: "" };

/** Matching exercises as the import format sees them (lettered headings, correct heading per text). */
function toPreview(exercise: ExamExerciseResponse): ExercisePreviewData | null {
    if (exercise.taskType === "SITUATION_MATCHING" && exercise.passages?.length && exercise.questions?.length) {
        const teil3 = (exercise.metadata?.teil3 ?? {}) as {
            advertisements?: PreviewAdvertisement[];
            situations?: { number: number; matchingProfile?: PreviewSituation["matchingProfile"] }[];
        };
        const letterByPassage = new Map(exercise.passages.map((p, i) => [p.id, (p.label?.trim() || String.fromCharCode(97 + i)).toLowerCase()]));
        const advertisements = exercise.passages.map((p, i) => {
            const letter = letterByPassage.get(p.id) ?? String.fromCharCode(97 + i);
            const stored = teil3.advertisements?.find((a) => a.id === letter);
            return stored ?? { id: letter, content: { description: htmlToText(p.content) } };
        });
        const questions = [...exercise.questions].sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
        return {
            title: exercise.title,
            instructions: exercise.teilDescription,
            headings: [],
            texts: [],
            advertisements,
            situations: questions.map((q, i) => ({
                id: q.id,
                number: q.questionNumber ?? i + 1,
                text: q.prompt,
                correctAdvertisementId: q.correctAnswer?.toUpperCase() === "X" ? "x" : (letterByPassage.get(q.correctAnswer) ?? null),
                matchingProfile: teil3.situations?.find((s) => s.number === (q.questionNumber ?? i + 1))?.matchingProfile ?? null,
            })),
        };
    }
    if (exercise.taskType === "MULTIPLE_CHOICE" && exercise.passages?.length === 1 && exercise.questions?.length) {
        const questions = [...exercise.questions].sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
        const categories = new Map(
            ((exercise.metadata?.gapQuestions ?? []) as { number: number; category?: string }[]).map((g) => [g.number, g.category ?? null]),
        );
        return {
            title: exercise.title,
            instructions: exercise.teilDescription,
            headings: [],
            texts: [],
            readingText: htmlToText(exercise.passages[0].content),
            questions: questions.map((q, i) => {
                const options = (q.options ?? []).map((text, j) => ({ id: String.fromCharCode(97 + j), text }));
                return {
                    id: q.id,
                    number: q.questionNumber ?? i + 1,
                    question: q.prompt,
                    options,
                    correctOptionId: options.find((o) => o.text === q.correctAnswer)?.id ?? null,
                    questionType: categories.get(q.questionNumber ?? i + 1) ?? null,
                };
            }),
        };
    }
    if (exercise.taskType !== "MATCHING" || !exercise.answerOptions?.length) return null;
    const labels = exercise.answerOptions.map((_, i) => exercise.answerOptionLabels?.[i]?.trim() || String.fromCharCode(97 + i));
    return {
        title: exercise.title,
        instructions: exercise.teilDescription,
        headings: exercise.answerOptions.map((text, i) => ({ id: labels[i], text })),
        texts: exercise.passages.map((p, i) => {
            const correct = exercise.questions.find((q) => q.sectionIndex === i)?.correctAnswer;
            const at = correct ? exercise.answerOptions!.indexOf(correct) : -1;
            return { id: p.id, content: htmlToText(p.content), correctHeadingId: at >= 0 ? labels[at] : null };
        }),
    };
}

/** Review queue / content library: filter, preview, move through the status workflow in bulk, export. */
export default function ContentLibrary() {
    const queryClient = useQueryClient();
    const { userProfile, hasHydrated } = useAuthStore();
    const [draft, setDraft] = useState<Filters>(emptyFilters);
    const [applied, setApplied] = useState<Filters>(emptyFilters);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const [previewRow, setPreviewRow] = useState<ExamExerciseAdminRow | null>(null);

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["admin", "exam", "exercises", "library", applied],
        queryFn: () =>
            getExamExercisesForAdmin({
                examType: applied.examType || undefined,
                level: applied.level || undefined,
                section: (applied.section || undefined) as ExamSection | undefined,
                partNumber: applied.partNumber || undefined,
                status: applied.status || undefined,
                search: applied.search || undefined,
            }).then((r) => r.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });

    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        rows.forEach((r) => { c[r.status ?? "DRAFT"] = (c[r.status ?? "DRAFT"] ?? 0) + 1; });
        return c;
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

    const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const togglePage = () => setSelected((s) => {
        const n = new Set(s);
        pageRows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
        return n;
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "exam"] });

    const moveTo = async (status: ExamContentStatus, ids: string[]) => {
        if (ids.length === 0) return;
        setBusy(true);
        try {
            const res = await changeExamContentStatus(ids, status);
            if (res.data.updated > 0) toast.success(`${res.data.updated} exercise${res.data.updated === 1 ? "" : "s"} moved to ${status.toLowerCase()}.`);
            if (res.data.failures.length > 0) {
                toast.error(`${res.data.failures.length} could not be moved: ${res.data.failures.slice(0, 3).map((f) => `${f.title ?? f.id} (${f.reason})`).join("; ")}`);
            }
            setSelected(new Set());
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to change the status."));
        } finally {
            setBusy(false);
        }
    };

    const exportContent = async (ids?: string[]) => {
        setBusy(true);
        try {
            const res = await downloadExamContentExport(
                ids ? { ids } : { examType: applied.examType, level: applied.level, section: applied.section, part: applied.partNumber ? Number(applied.partNumber) : undefined, status: applied.status }
            );
            toast.success(`Exported ${res.exported} exercise${res.exported === 1 ? "" : "s"}${res.skipped ? ` (${res.skipped} not representable in the import format were left out)` : ""}.`);
        } catch (err) {
            toast.error(errorMessage(err, "Nothing to export for this selection."));
        } finally {
            setBusy(false);
        }
    };

    const field = (key: keyof Filters) => ({ value: draft[key], onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setDraft({ ...draft, [key]: e.target.value }) });

    return (
        <ExamContentShell
            title="Content Library"
            description="Review imported exercises, edit them, and move them through Draft → Review → Approved → Published. Only published exercises are visible to learners."
        >
            <form
                onSubmit={(e) => { e.preventDefault(); setApplied(draft); setPage(1); setSelected(new Set()); }}
                className={`${cardClass} p-6 flex flex-wrap items-end gap-4 [&>label]:min-w-[140px] [&>label]:flex-1`}
            >
                <label><span className={labelClass}>Exam</span>
                    <select className={fieldClass} {...field("examType")}><option value="">All</option>{Object.entries(EXAM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label><span className={labelClass}>Level</span>
                    <select className={fieldClass} {...field("level")}><option value="">All</option>{["A1", "A2", "B1", "B2", "C1"].map((l) => <option key={l}>{l}</option>)}</select></label>
                <label><span className={labelClass}>Section</span>
                    <select className={fieldClass} {...field("section")}><option value="">All</option>{(Object.keys(SECTION_LABELS) as ExamSection[]).map((s) => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}</select></label>
                <label><span className={labelClass}>Teil</span>
                    <select className={fieldClass} {...field("partNumber")}><option value="">All</option>{[1, 2, 3].map((n) => <option key={n} value={n}>Teil {n}</option>)}</select></label>
                <label><span className={labelClass}>Status</span>
                    <select className={fieldClass} {...field("status")}><option value="">All</option>{EXAM_CONTENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}</select></label>
                <label><span className={labelClass}>Search title</span><input className={fieldClass} {...field("search")} placeholder="Title..." /></label>
                <div className="flex gap-2">
                    <Button type="submit">Apply</Button>
                    <Button type="button" variant="secondary" onClick={() => { setDraft(emptyFilters); setApplied(emptyFilters); setPage(1); }}>Reset</Button>
                </div>
            </form>

            <div className={`${cardClass} mt-6 p-6`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-white">{rows.length} exercises</span>
                        {EXAM_CONTENT_STATUSES.filter((s) => counts[s]).map((s) => (
                            <span key={s} className="flex items-center gap-1"><StatusBadge status={s} /> {counts[s]}</span>
                        ))}
                    </div>
                    <Button variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-1.5" disabled={busy || rows.length === 0} onClick={() => exportContent()}>
                        <Download className="size-4" /> Export all filtered
                    </Button>
                </div>

                {selected.size > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{selected.size} selected</span>
                        {BULK_ACTIONS.map((a) => (
                            <Button key={a.status} variant="secondary" className="px-3 py-1 text-sm" disabled={busy} onClick={() => moveTo(a.status, [...selected])}>{a.label}</Button>
                        ))}
                        <Button variant="secondary" className="px-3 py-1 text-sm" disabled={busy} onClick={() => exportContent([...selected])}>Export JSON</Button>
                        <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm underline text-blue-800 dark:text-blue-200">Clear</button>
                    </div>
                )}

                {isLoading ? (
                    <Loading message="Loading exercises..." />
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="px-3 py-3 w-8"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={togglePage} /></th>
                                    <th className="px-3 py-3">ID</th>
                                    <th className="px-3 py-3">Title</th>
                                    <th className="px-3 py-3">Exam</th>
                                    <th className="px-3 py-3">Level</th>
                                    <th className="px-3 py-3">Teil</th>
                                    <th className="px-3 py-3">Difficulty</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Ver.</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pageRows.map((r) => (
                                    <tr key={r.id} className="text-gray-800 dark:text-gray-200">
                                        <td className="px-3 py-3"><input type="checkbox" aria-label={`Select ${r.title}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                                        <td className="px-3 py-3 font-mono text-xs">{r.externalId ?? "—"}</td>
                                        <td className="px-3 py-3 max-w-xs truncate" title={r.title}>{r.title}</td>
                                        <td className="px-3 py-3">{EXAM_LABELS[r.examType ?? "TELC"] ?? r.examType}</td>
                                        <td className="px-3 py-3">{r.level ?? "—"}</td>
                                        <td className="px-3 py-3 whitespace-nowrap">{SECTION_LABELS[r.section]}{r.partNumber ? ` · ${r.partNumber}` : ""}</td>
                                        <td className="px-3 py-3">{r.difficulty ? r.difficulty.charAt(0) + r.difficulty.slice(1).toLowerCase() : "—"}</td>
                                        <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                                        <td className="px-3 py-3">v{r.version}</td>
                                        <td className="px-3 py-3 whitespace-nowrap space-x-1.5">
                                            <Button variant="secondary" className="px-2.5 py-1 text-xs inline-flex items-center gap-1" onClick={() => setPreviewRow(r)}><Eye className="size-3.5" />Preview</Button>
                                            <Link href={`/admin/exam-prep/${SECTION_PATHS[r.section]}?edit=${r.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold hover:bg-accent"><Pencil className="size-3.5" />Edit</Link>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr><td colSpan={10} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400">No exercises found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4">
                    <AdminTablePagination
                        page={currentPage}
                        totalPages={totalPages}
                        totalItems={rows.length}
                        startIndex={rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                        endIndex={Math.min(currentPage * PAGE_SIZE, rows.length)}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {previewRow && <PreviewDialog row={previewRow} onClose={() => setPreviewRow(null)} onMove={(status) => { setPreviewRow(null); void moveTo(status, [previewRow.id]); }} />}
            {busy && <Loading message="Please wait..." />}
        </ExamContentShell>
    );
}

function PreviewDialog({ row, onClose, onMove }: Readonly<{ row: ExamExerciseAdminRow; onClose: () => void; onMove: (s: ExamContentStatus) => void }>) {
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "exam", "exercises", "detail", row.id],
        queryFn: () => getExamExerciseForAdmin(row.id).then((r) => r.data),
        staleTime: 0,
    });
    const preview = data ? toPreview(data) : null;
    const next: { label: string; status: ExamContentStatus }[] = {
        DRAFT: [{ label: "Send to review", status: "REVIEW" as const }],
        REVIEW: [{ label: "Approve", status: "APPROVED" as const }, { label: "Reject", status: "REJECTED" as const }],
        APPROVED: [{ label: "Publish", status: "PUBLISHED" as const }],
        PUBLISHED: [{ label: "Unpublish", status: "DRAFT" as const }],
        REJECTED: [{ label: "Back to draft", status: "DRAFT" as const }],
        ARCHIVED: [{ label: "Restore as draft", status: "DRAFT" as const }],
    }[row.status ?? "DRAFT"];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${row.title}`}>
            <div className="my-8 w-full max-w-3xl rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{row.title}</h2>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><StatusBadge status={row.status} /> {row.externalId ?? ""} · v{row.version}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close preview" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="size-5" /></button>
                </div>
                <div className="mt-5">
                    {isLoading && <Loading message="Loading..." />}
                    {data && (preview ? <ExerciseView preview={preview} /> : <p className="text-sm text-gray-600 dark:text-gray-300">A preview is only available for headings-matching, reading-text multiple-choice and situation-matching exercises. Use Edit to review this one.</p>)}
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    {next.map((n) => <Button key={n.status} onClick={() => onMove(n.status)}>{n.label}</Button>)}
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}
