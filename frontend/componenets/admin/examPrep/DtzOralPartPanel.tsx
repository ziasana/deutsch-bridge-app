"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, PenLine, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { createDtzOralTemplate } from "@/services/adminExamContentService";
import { DTZ_ORAL_PARTS, DtzOralPart } from "@/types/dtzOral";
import { cardClass, errorMessage } from "@/componenets/admin/examContent/shared";
import DtzOralEditor from "./DtzOralEditor";
import DtzOralImportPanel from "./DtzOralImportPanel";
import DtzOralPromptPanel from "./DtzOralPromptPanel";
import ExamExerciseBrowser from "./ExamExerciseBrowser";

type Tool = "prompt" | "import" | null;

/**
 * One tab of Admin → Mündlicher Ausdruck → DTZ A2–B1. The tab chooses the Teil that the tools above the list work on: AI prompt, Upload JSON
 * and the editor of that Teil. The list below is the shared exercise list of all three Teile (filter by Teil there); editing a row of another
 * Teil switches to that Teil's tab.
 */
export default function DtzOralPartPanel({
    part,
    initialEditId,
    onEditHandled,
    onEditOtherPart,
}: Readonly<{ part: DtzOralPart; initialEditId?: string | null; onEditHandled?: () => void; onEditOtherPart?: (part: DtzOralPart, id: string) => void }>) {
    const queryClient = useQueryClient();
    const meta = DTZ_ORAL_PARTS.find((p) => p.part === part)!;
    const [tool, setTool] = useState<Tool>(null);
    const [busy, setBusy] = useState(false);
    const [editor, setEditor] = useState<{ id: string | null } | null>(initialEditId ? { id: initialEditId } : null);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "exam"] });

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

            <ExamExerciseBrowser
                section="MUENDLICHER_AUSDRUCK"
                examType="DTZ"
                teilNumbers={[1, 2, 3]}
                onEdit={(row) => {
                    const rowPart = (row.partNumber ?? 1) as DtzOralPart;
                    if (rowPart === part) setEditor({ id: row.id });
                    else onEditOtherPart?.(rowPart, row.id);
                }}
            />

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
