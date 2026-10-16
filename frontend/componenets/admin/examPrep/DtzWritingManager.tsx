"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, PenLine, Sparkles } from "lucide-react";
import ExamContentShell from "@/componenets/admin/examContent/ExamContentShell";
import { cardClass } from "@/componenets/admin/examContent/shared";
import DtzWritingChoiceEditor from "./DtzWritingChoiceEditor";
import ExamExerciseBrowser from "./ExamExerciseBrowser";

/**
 * Admin → Prüfungsvorbereitung → DTZ A2–B1 → Schreiben: Aufgabe A oder Aufgabe B (two alternatives, four content points each, 30 minutes).
 * Every step of the content workflow: generate a prompt for an external AI, import its JSON, create by hand, preview, edit, publish, archive.
 */
export default function DtzWritingManager() {
    const queryClient = useQueryClient();
    // Deep link from the Content Library ("?edit=<id>"): open that exercise's editor on arrival (the page renders only after hydration).
    const [editor, setEditor] = useState<{ id: string | null } | null>(() => {
        const id = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("edit");
        return id ? { id } : null;
    });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "exam"] });

    // Drop "edit" from the address once it has been picked up, so a reload does not reopen the editor.
    useEffect(() => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("edit")) return;
        url.searchParams.delete("edit");
        window.history.replaceState(null, "", url.pathname + url.search);
    }, []);

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

            <ExamExerciseBrowser section="SCHRIFTLICHER_AUSDRUCK" examType="DTZ" onEdit={(row) => setEditor({ id: row.id })} />

            {editor && (
                <DtzWritingChoiceEditor
                    exerciseId={editor.id}
                    onClose={() => setEditor(null)}
                    onSaved={() => { setEditor(null); void refresh(); }}
                />
            )}
        </ExamContentShell>
    );
}
