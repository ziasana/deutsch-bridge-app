"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, FileUp, Pencil, PenLine, Rocket, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import useAuthStore from "@/store/useAuthStore";
import { getExamExercisesForAdmin } from "@/services/adminExamService";
import { changeExamContentStatus } from "@/services/adminExamContentService";
import { ExamExerciseAdminRow } from "@/types/exam";
import { ExamContentStatus, EXAM_CONTENT_STATUSES } from "@/types/examContent";
import ExamContentShell from "@/componenets/admin/examContent/ExamContentShell";
import { PreviewDialog } from "@/componenets/admin/examContent/ContentLibrary";
import { cardClass, errorMessage, fieldClass, labelClass, StatusBadge, textTypeLabel } from "@/componenets/admin/examContent/shared";
import DtzWritingChoiceEditor from "./DtzWritingChoiceEditor";

const PAGE_SIZE = 15;
const LIST_KEY = ["admin", "exam", "exercises", "dtz-schreiben"];

const difficultyLabel = (difficulty: string | null) =>
    !difficulty ? "—" : /^A2|^B1/.test(difficulty) ? difficulty.replace("_", "–") : difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "—");
/** The row carries the communication types of Aufgabe A and B comma-separated in `sourceType`. */
const taskTypes = (row: ExamExerciseAdminRow): [string, string] => {
    const [a, b] = (row.sourceType ?? "").split(", ");
    return [a ? textTypeLabel(a) : "—", b ? textTypeLabel(b) : "—"];
};

/**
 * Admin → Prüfungsvorbereitung → DTZ A2–B1 → Schreiben: Aufgabe A oder Aufgabe B (two alternatives, four content points each, 30 minutes).
 * Every step of the content workflow: generate a prompt for an external AI, import its JSON, create by hand, preview, edit, publish, archive.
 */
export default function DtzWritingManager() {
    const queryClient = useQueryClient();
    const { userProfile, hasHydrated } = useAuthStore();
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [busy, setBusy] = useState(false);
    const [previewRow, setPreviewRow] = useState<ExamExerciseAdminRow | null>(null);
    const [editor, setEditor] = useState<{ id: string | null } | null>(null);

    const { data: rows = [], isLoading } = useQuery({
        queryKey: [...LIST_KEY, status, search],
        queryFn: () =>
            getExamExercisesForAdmin({
                examType: "DTZ",
                section: "SCHRIFTLICHER_AUSDRUCK",
                status: status || undefined,
                search: search || undefined,
            }).then((r) => r.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });

    // Deep link from the Content Library ("?edit=<id>"): open that exercise's editor on arrival.
    useEffect(() => {
        const url = new URL(window.location.href);
        const id = url.searchParams.get("edit");
        if (!id) return;
        setEditor({ id });
        url.searchParams.delete("edit");
        window.history.replaceState(null, "", url.pathname + url.search);
    }, []);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "exam"] });

    /** Moves one exercise through the given statuses in order; stops at the first one the backend refuses. */
    const moveThrough = async (row: ExamExerciseAdminRow, statuses: ExamContentStatus[]) => {
        setBusy(true);
        try {
            for (const target of statuses) {
                const res = await changeExamContentStatus([row.id], target);
                if (res.data.failures.length > 0) {
                    toast.error(`${row.title}: ${res.data.failures[0].reason}`);
                    return;
                }
            }
            toast.success(`"${row.title}" is now ${statuses[statuses.length - 1].toLowerCase()}.`);
        } catch (err) {
            toast.error(errorMessage(err, "Failed to change the status."));
        } finally {
            setBusy(false);
            await refresh();
        }
    };

    const publish = (row: ExamExerciseAdminRow) => moveThrough(row, row.status === "APPROVED" ? ["PUBLISHED"] : ["APPROVED", "PUBLISHED"]);

    return (
        <ExamContentShell
            title="DTZ A2–B1 · Schreiben"
            description="Aufgabe A oder Aufgabe B: two alternative letter or email tasks with four content points each — the learner chooses one and writes for 30 minutes. Generate content with any external AI, import the JSON, review it and publish it. Imported content is never published automatically."
        >
            <div className={`${cardClass} flex flex-wrap items-center gap-3 p-6`}>
                <Link
                    href="/admin/exam-prep/content-generator?exam=DTZ&section=SCHREIBEN&part=TEIL_1"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                    <Sparkles className="size-4" /> Generate with external AI
                </Link>
                <Link
                    href="/admin/exam-prep/import"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                    <FileUp className="size-4" /> Import JSON
                </Link>
                <button
                    type="button"
                    onClick={() => setEditor({ id: null })}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                    <PenLine className="size-4" /> Create manually
                </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className={`${cardClass} mt-6 flex flex-wrap items-end gap-4 p-6 [&>label]:min-w-[160px] [&>label]:flex-1`}>
                <label>
                    <span className={labelClass}>Status</span>
                    <select className={fieldClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All</option>
                        {EXAM_CONTENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                    </select>
                </label>
                <label>
                    <span className={labelClass}>Search title</span>
                    <input className={fieldClass} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Title..." />
                </label>
            </form>

            <div className={`${cardClass} mt-6 p-6`}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{rows.length} exercise{rows.length === 1 ? "" : "s"}</p>
                {isLoading ? (
                    <Loading message="Loading exercises..." />
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-3 py-3">Title</th>
                                    <th className="px-3 py-3">Topic</th>
                                    <th className="px-3 py-3">Difficulty</th>
                                    <th className="px-3 py-3">Task A type</th>
                                    <th className="px-3 py-3">Task B type</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Created</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pageRows.map((r) => {
                                    const [typeA, typeB] = taskTypes(r);
                                    return (
                                        <tr key={r.id} className="text-gray-800 dark:text-gray-200">
                                            <td className="max-w-xs truncate px-3 py-3" title={r.title}>{r.title}</td>
                                            <td className="px-3 py-3">{r.topic ?? "—"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap">{difficultyLabel(r.difficulty)}</td>
                                            <td className="px-3 py-3 whitespace-nowrap">{typeA}</td>
                                            <td className="px-3 py-3 whitespace-nowrap">{typeB}</td>
                                            <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                                            <td className="px-3 py-3 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                                            <td className="space-x-1.5 whitespace-nowrap px-3 py-3">
                                                <Button variant="secondary" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" onClick={() => setPreviewRow(r)}>
                                                    <Eye className="size-3.5" />Preview
                                                </Button>
                                                <Button variant="secondary" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" onClick={() => setEditor({ id: r.id })}>
                                                    <Pencil className="size-3.5" />Edit
                                                </Button>
                                                {r.status !== "PUBLISHED" && r.status !== "ARCHIVED" && (
                                                    <Button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" disabled={busy} onClick={() => publish(r)}>
                                                        <Rocket className="size-3.5" />Publish
                                                    </Button>
                                                )}
                                                {r.status === "PUBLISHED" && (
                                                    <Button variant="secondary" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => moveThrough(r, ["DRAFT"])}>Unpublish</Button>
                                                )}
                                                {r.status === "ARCHIVED" ? (
                                                    <Button variant="secondary" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => moveThrough(r, ["DRAFT"])}>Restore</Button>
                                                ) : (
                                                    <Button variant="secondary" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" disabled={busy} onClick={() => moveThrough(r, ["ARCHIVED"])}>
                                                        <Archive className="size-3.5" />Archive
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {rows.length === 0 && (
                                    <tr><td colSpan={8} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400">No exercises yet. Generate a prompt for an external AI, then import its JSON.</td></tr>
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

            {previewRow && (
                <PreviewDialog
                    row={previewRow}
                    onClose={() => setPreviewRow(null)}
                    onMove={(target) => {
                        const row = previewRow;
                        setPreviewRow(null);
                        void (target === "PUBLISHED" ? publish(row) : moveThrough(row, [target]));
                    }}
                />
            )}
            {editor && (
                <DtzWritingChoiceEditor
                    exerciseId={editor.id}
                    onClose={() => setEditor(null)}
                    onSaved={() => { setEditor(null); void refresh(); }}
                />
            )}
            {busy && <Loading message="Please wait..." />}
        </ExamContentShell>
    );
}
