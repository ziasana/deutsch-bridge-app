"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, FileUp, ImageOff, Pencil, PenLine, Rocket, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import useAuthStore from "@/store/useAuthStore";
import { getExamExercisesForAdmin } from "@/services/adminExamService";
import { changeExamContentStatus, createDtzOralTemplate } from "@/services/adminExamContentService";
import { ExamExerciseAdminRow } from "@/types/exam";
import { ExamContentStatus, EXAM_CONTENT_STATUSES } from "@/types/examContent";
import { DTZ_ORAL_PARTS, DtzOralPart } from "@/types/dtzOral";
import { PreviewDialog } from "@/componenets/admin/examContent/ContentLibrary";
import { cardClass, errorMessage, fieldClass, labelClass, StatusBadge } from "@/componenets/admin/examContent/shared";
import DtzOralEditor from "./DtzOralEditor";
import DtzOralImportPanel from "./DtzOralImportPanel";
import DtzOralPromptPanel from "./DtzOralPromptPanel";

const PAGE_SIZE = 15;

const difficultyLabel = (difficulty: string | null) =>
    !difficulty ? "—" : /^A2|^B1/.test(difficulty) ? difficulty.replace("_", "–") : difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "—");

type Tool = "prompt" | "import" | null;

/**
 * One tab of Admin → DTZ A2–B1 → Mündliche Prüfung. Every tab offers the same workflow with the editor of its own Teil:
 * AI prompt → Upload JSON → Validate → Preview → Save as Draft → Publish → Archive.
 */
export default function DtzOralPartPanel({ part, initialEditId, onEditHandled }: Readonly<{ part: DtzOralPart; initialEditId?: string | null; onEditHandled?: () => void }>) {
    const queryClient = useQueryClient();
    const { userProfile, hasHydrated } = useAuthStore();
    const meta = DTZ_ORAL_PARTS.find((p) => p.part === part)!;
    const [tool, setTool] = useState<Tool>(null);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [busy, setBusy] = useState(false);
    const [previewRow, setPreviewRow] = useState<ExamExerciseAdminRow | null>(null);
    const [editor, setEditor] = useState<{ id: string | null } | null>(initialEditId ? { id: initialEditId } : null);

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["admin", "exam", "exercises", "dtz-muendlich", part, status, search],
        queryFn: () =>
            getExamExercisesForAdmin({
                examType: "DTZ",
                section: "MUENDLICHER_AUSDRUCK",
                partNumber: String(part),
                status: status || undefined,
                search: search || undefined,
            }).then((r) => r.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });

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
    const missingImage = (row: ExamExerciseAdminRow) => part === 2 && !row.hasImage;

    const createTemplate = async () => {
        setBusy(true);
        try {
            await createDtzOralTemplate();
            toast.success("Standard template created as draft.");
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Could not create the template."));
        } finally {
            setBusy(false);
        }
    };

    const toolButton = (value: Exclude<Tool, null>, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            aria-pressed={tool === value}
            onClick={() => setTool(tool === value ? null : value)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${tool === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"}`}
        >
            {icon}{label}
        </button>
    );

    return (
        <div role="tabpanel" aria-label={`${meta.label} — ${meta.title}`}>
            <div className={`${cardClass} flex flex-wrap items-center gap-3 p-6`}>
                {toolButton("prompt", "AI Content Generation Prompt", <Sparkles className="size-4" />)}
                {toolButton("import", "Upload JSON", <FileUp className="size-4" />)}
                {part === 1 ? (
                    <>
                        <Button className="inline-flex items-center gap-2" disabled={busy} onClick={createTemplate}><PenLine className="size-4" />Create standard template</Button>
                        <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => setEditor({ id: null })}>Create manually</Button>
                    </>
                ) : (
                    <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => setEditor({ id: null })}><PenLine className="size-4" />Create manually</Button>
                )}
            </div>
            {tool === "prompt" && <div className={`${cardClass} mt-4 p-6`}><DtzOralPromptPanel part={part} /></div>}
            {tool === "import" && <div className={`${cardClass} mt-4 p-6`}><DtzOralImportPanel part={part} onImported={refresh} /></div>}

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
                                    <th className="px-3 py-3">Part</th>
                                    {part !== 1 && <th className="px-3 py-3">Topic</th>}
                                    <th className="px-3 py-3">Difficulty</th>
                                    {part === 2 && <th className="px-3 py-3">Image</th>}
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Created</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pageRows.map((r) => (
                                    <tr key={r.id} className="text-gray-800 dark:text-gray-200">
                                        <td className="max-w-xs truncate px-3 py-3" title={r.title}>{r.title}</td>
                                        <td className="px-3 py-3 whitespace-nowrap">Teil {r.partNumber ?? part}</td>
                                        {part !== 1 && <td className="px-3 py-3">{r.topic ?? "—"}</td>}
                                        <td className="px-3 py-3 whitespace-nowrap">{difficultyLabel(r.difficulty)}</td>
                                        {part === 2 && (
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                {r.hasImage
                                                    ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">Attached</span>
                                                    : <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"><ImageOff className="size-3" />Missing</span>}
                                            </td>
                                        )}
                                        <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                                        <td className="px-3 py-3 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                                        <td className="space-x-1.5 whitespace-nowrap px-3 py-3">
                                            <Button variant="secondary" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" onClick={() => setPreviewRow(r)}><Eye className="size-3.5" />Preview</Button>
                                            <Button variant="secondary" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" onClick={() => setEditor({ id: r.id })}><Pencil className="size-3.5" />Edit</Button>
                                            {r.status !== "PUBLISHED" && r.status !== "ARCHIVED" && (
                                                <Button
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs"
                                                    disabled={busy || missingImage(r)}
                                                    title={missingImage(r) ? "Attach a photo first" : undefined}
                                                    onClick={() => publish(r)}
                                                >
                                                    <Rocket className="size-3.5" />Publish
                                                </Button>
                                            )}
                                            {r.status === "PUBLISHED" && <Button variant="secondary" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => moveThrough(r, ["DRAFT"])}>Unpublish</Button>}
                                            {r.status === "ARCHIVED" ? (
                                                <Button variant="secondary" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => moveThrough(r, ["DRAFT"])}>Restore</Button>
                                            ) : (
                                                <Button variant="secondary" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs" disabled={busy} onClick={() => moveThrough(r, ["ARCHIVED"])}><Archive className="size-3.5" />Archive</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                                            {part === 1 ? "No template yet. Create the standard template, or generate one with an external AI." : "No exercises yet. Generate a prompt for an external AI, then upload its JSON."}
                                        </td>
                                    </tr>
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
                <DtzOralEditor
                    part={part}
                    exerciseId={editor.id}
                    onClose={() => { setEditor(null); onEditHandled?.(); }}
                    onSaved={() => { setEditor(null); onEditHandled?.(); void refresh(); }}
                />
            )}
            {busy && <Loading message="Please wait..." />}
        </div>
    );
}
