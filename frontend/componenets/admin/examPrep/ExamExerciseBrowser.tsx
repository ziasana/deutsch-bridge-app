"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import AdminFilterCard, { adminFilterFieldClass } from "@/componenets/admin/AdminFilterCard";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import SortableTh from "@/componenets/admin/table/SortableTh";
import { PreviewDialog } from "@/componenets/admin/examContent/ContentLibrary";
import { errorMessage } from "@/componenets/admin/examContent/shared";
import { TASK_TYPE_LABELS } from "@/componenets/exam/examMeta";
import { changeExamContentStatus } from "@/services/adminExamContentService";
import { deleteExamExercise, getExamExercisesForAdmin } from "@/services/adminExamService";
import useAuthStore from "@/store/useAuthStore";
import { ExamExerciseAdminRow, ExamSection, ExamTaskType, ExamTypeCode } from "@/types/exam";
import { ExamContentStatus, EXAM_CONTENT_STATUSES } from "@/types/examContent";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

type SortKey = "title" | "teil" | "level" | "questions";
type SortDirection = "asc" | "desc";

interface Filters {
    level: string;
    partNumber: string;
    taskType: string;
    status: string;
    search: string;
}
const emptyFilters: Filters = { level: "", partNumber: "", taskType: "", status: "", search: "" };

/**
 * Sprachbausteine's Teil is fixed by its task type (Multiple-Choice = Teil 1, Lückentext = Teil 2), which is also how students see it - so a stale
 * stored partNumber must not override it. Other sections use the stored partNumber.
 */
export const effectivePartNumber = (exercise: Pick<ExamExerciseAdminRow, "section" | "taskType" | "partNumber">): number | null => {
    if (exercise.section === "SPRACHBAUSTEINE" && exercise.taskType) {
        return exercise.taskType === "WORD_BANK_CLOZE" ? 2 : 1;
    }
    return exercise.partNumber;
};

const teilLabel = (section: ExamSection, partNumber: number | null): string => {
    if (section === "SCHRIFTLICHER_AUSDRUCK") return "Schriftlicher Ausdruck";
    if (section === "TESTFORMAT_INFORMATION") return "Testformat Information";
    return `Teil ${partNumber ?? 1}`;
};

const statusLabel = (row: ExamExerciseAdminRow) =>
    row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase() : row.published ? "Published" : "Draft";

interface Props {
    section: ExamSection;
    /** The exam of the page; the list shows only this exam's exercises. */
    examType: ExamTypeCode;
    /** Teil numbers offered in the Teil filter; omit for sections without Teile. */
    teilNumbers?: number[];
    /** Task types offered in the task-type filter (shown when there is more than one). */
    taskTypes?: ExamTaskType[];
    /** Opens the editor of a row; without it the rows have no Edit button (imported-only content). */
    onEdit?: (row: ExamExerciseAdminRow) => void;
    /** Rows can be deleted (with confirmation) when set. */
    deletable?: boolean;
}

/**
 * The exercise list every Prüfungsvorbereitung admin page shares - Telc B1 and DTZ A2–B1, in every section: the same "Find exercises" filters
 * (level for Telc, Teil, task type, status, title; nothing is loaded until the admin searches) and the same sortable table with preview, edit,
 * delete and the publish / unpublish / archive workflow.
 */
export default function ExamExerciseBrowser({ section, examType, teilNumbers, taskTypes = [], onEdit, deletable = false }: Readonly<Props>) {
    const queryClient = useQueryClient();
    const { userProfile, hasHydrated } = useAuthStore();
    const [draft, setDraft] = useState<Filters>(emptyFilters);
    const [applied, setApplied] = useState<Filters | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("title");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [busy, setBusy] = useState(false);
    const [previewRow, setPreviewRow] = useState<ExamExerciseAdminRow | null>(null);
    const [toDelete, setToDelete] = useState<ExamExerciseAdminRow | null>(null);
    const showLevel = examType === "TELC";

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["admin", "exam", "exercises", "browser", section, examType, applied],
        queryFn: () =>
            getExamExercisesForAdmin({
                section,
                examType,
                level: applied?.level || undefined,
                partNumber: applied?.partNumber || undefined,
                taskType: applied?.taskType || undefined,
                status: applied?.status || undefined,
                search: applied?.search || undefined,
            }).then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN" && applied !== null,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "exam"] });

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setApplied({ ...draft, search: draft.search.trim() });
    };
    const reset = () => {
        setDraft(emptyFilters);
        setApplied(null);
        setPage(1);
    };
    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDirection("asc");
        }
        setPage(1);
    };

    const sortValue = (row: ExamExerciseAdminRow) => {
        switch (sortKey) {
            case "title":
                return row.title.toLowerCase();
            case "teil":
                return effectivePartNumber(row) ?? 1;
            case "level":
                return row.level ?? "";
            case "questions":
                return row.questionCount;
        }
    };
    const sorted = rows.slice().sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const va = sortValue(a);
        const vb = sortValue(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, sorted.length);
    const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

    const confirmDelete = () => {
        const row = toDelete;
        if (!row) return;
        setToDelete(null);
        deleteExamExercise(row.id)
            .then(() => {
                toast.success("Exercise deleted.");
                void refresh();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete exercise."));
    };

    const small = "px-3 py-1 text-sm";

    return (
        <>
            <AdminFilterCard title="Find exercises" noun="Exercises" onSubmit={search} onReset={reset}>
                {showLevel && (
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Level
                        <select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} className={adminFilterFieldClass}>
                            <option value="">All levels</option>
                            {LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    {lvl}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {teilNumbers && (
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Teil
                        <select value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} className={adminFilterFieldClass}>
                            <option value="">All Teile</option>
                            {teilNumbers.map((n) => (
                                <option key={n} value={String(n)}>
                                    Teil {n}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {taskTypes.length > 1 && (
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Task type
                        <select value={draft.taskType} onChange={(e) => setDraft({ ...draft, taskType: e.target.value })} className={adminFilterFieldClass}>
                            <option value="">All task types</option>
                            {taskTypes.map((t) => (
                                <option key={t} value={t}>
                                    {TASK_TYPE_LABELS[t] ?? t}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="text-sm text-gray-700 dark:text-gray-300">
                    Status
                    <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={adminFilterFieldClass}>
                        <option value="">Any</option>
                        {EXAM_CONTENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s.charAt(0) + s.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm text-gray-700 dark:text-gray-300 !flex-[2] !min-w-[220px]">
                    Title
                    <input
                        type="text"
                        value={draft.search}
                        onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                        placeholder="Search by exercise title..."
                        className={adminFilterFieldClass}
                    />
                </label>
            </AdminFilterCard>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing exercises</h2>

                <div className="px-6 pt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        Show
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        entries
                    </label>
                </div>

                {applied === null ? (
                    <p className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">Use the filters above and press Search to list exercises.</p>
                ) : isLoading ? (
                    <Loading message="Loading exercises..." />
                ) : (
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                <tr>
                                    <SortableTh label="Title" active={sortKey === "title"} direction={sortDirection} onClick={() => toggleSort("title")} />
                                    <SortableTh label="Teil" active={sortKey === "teil"} direction={sortDirection} onClick={() => toggleSort("teil")} />
                                    <th className="px-6 py-3">Task type</th>
                                    <SortableTh label="Level" active={sortKey === "level"} direction={sortDirection} onClick={() => toggleSort("level")} />
                                    <SortableTh label="Questions" active={sortKey === "questions"} direction={sortDirection} onClick={() => toggleSort("questions")} />
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pageRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">{row.title}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{teilLabel(row.section, effectivePartNumber(row))}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.taskType ? TASK_TYPE_LABELS[row.taskType] ?? row.taskType : "—"}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary">{row.examType === "DTZ" ? "DTZ A2–B1" : (row.level ?? "All levels")}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.questionCount}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={row.published ? "default" : "outline"}>{statusLabel(row)}</Badge>
                                        </td>
                                        <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                            <Button variant="secondary" className={small} onClick={() => setPreviewRow(row)}>
                                                Preview
                                            </Button>
                                            {onEdit && (
                                                <Button variant="secondary" className={small} onClick={() => onEdit(row)}>
                                                    Edit
                                                </Button>
                                            )}
                                            {row.status !== "PUBLISHED" && row.status !== "ARCHIVED" && (
                                                <Button className={small} disabled={busy} onClick={() => publish(row)}>
                                                    Publish
                                                </Button>
                                            )}
                                            {row.status === "PUBLISHED" && (
                                                <Button variant="secondary" className={small} disabled={busy} onClick={() => moveThrough(row, ["DRAFT"])}>
                                                    Unpublish
                                                </Button>
                                            )}
                                            {row.status === "ARCHIVED" ? (
                                                <Button variant="secondary" className={small} disabled={busy} onClick={() => moveThrough(row, ["DRAFT"])}>
                                                    Restore
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" className={small} disabled={busy} onClick={() => moveThrough(row, ["ARCHIVED"])}>
                                                    Archive
                                                </Button>
                                            )}
                                            {deletable && (
                                                <Button variant="secondary" className={small} onClick={() => setToDelete(row)}>
                                                    Delete
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {sorted.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                            No exercises found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {applied !== null && !isLoading && (
                    <div className="px-6 py-4">
                        <AdminTablePagination page={currentPage} totalPages={totalPages} totalItems={sorted.length} startIndex={startIndex} endIndex={endIndex} onPageChange={setPage} />
                    </div>
                )}
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
            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                title="Delete this exercise?"
                message={`Delete "${toDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
            {busy && <Loading message="Please wait..." />}
        </>
    );
}
