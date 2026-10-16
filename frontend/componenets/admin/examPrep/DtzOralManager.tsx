"use client";

import { useEffect, useState } from "react";
import ExamContentShell from "@/componenets/admin/examContent/ExamContentShell";
import { DTZ_ORAL_PARTS, DtzOralPart } from "@/types/dtzOral";
import DtzOralPartPanel from "./DtzOralPartPanel";

const partFromParam = (value: string | null): DtzOralPart => (value === "2" ? 2 : value === "3" ? 3 : 1);

/**
 * Admin → Prüfungsvorbereitung → DTZ A2–B1 → Mündliche Prüfung. Three tabs, one per Teil, each with the editor, prompt and import of its own
 * structure: Teil 1 fixed self-introduction template, Teil 2 photo with experience questions, Teil 3 joint planning.
 */
/** "?part=2&edit=<id>" of a deep link from the Content Library (the shell renders nothing until the client has hydrated, so reading the URL here is safe). */
const readDeepLink = () => {
    if (typeof window === "undefined") return { part: 1 as DtzOralPart, edit: null as string | null };
    const params = new URL(window.location.href).searchParams;
    return { part: partFromParam(params.get("part")), edit: params.get("edit") };
};

export default function DtzOralManager() {
    const [initial] = useState(readDeepLink);
    const [part, setPart] = useState<DtzOralPart>(initial.part);
    const [editId, setEditId] = useState<string | null>(initial.edit);

    // Drop "edit" from the address once it has been picked up, so a reload does not reopen the editor.
    useEffect(() => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("edit")) return;
        url.searchParams.delete("edit");
        window.history.replaceState(null, "", url.pathname + url.search);
    }, []);

    const choose = (next: DtzOralPart) => {
        setPart(next);
        const url = new URL(window.location.href);
        url.searchParams.set("part", String(next));
        window.history.replaceState(null, "", url.pathname + url.search);
    };

    return (
        <ExamContentShell
            title="DTZ A2–B1 · Mündliche Prüfung"
            description="Three parts with three different structures: Teil 1 is the fixed self-introduction template, Teil 2 a photo with experience questions (A2 and B1), Teil 3 a joint planning task. Generate content with any external AI, import the JSON, review it and publish it. Imported content is never published automatically."
        >
            <div role="tablist" aria-label="Teile der Mündlichen Prüfung" className="mb-6 flex flex-wrap gap-2">
                {DTZ_ORAL_PARTS.map((p) => (
                    <button
                        key={p.part}
                        type="button"
                        role="tab"
                        aria-selected={part === p.part}
                        onClick={() => choose(p.part)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${part === p.part ? "bg-primary text-primary-foreground" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}
                    >
                        {p.label} — {p.title}
                    </button>
                ))}
            </div>
            <DtzOralPartPanel
                key={part}
                part={part}
                initialEditId={editId}
                onEditHandled={() => setEditId(null)}
                onEditOtherPart={(other, id) => {
                    setEditId(id);
                    choose(other);
                }}
            />
        </ExamContentShell>
    );
}
