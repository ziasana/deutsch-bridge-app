"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { getSpeakingGuides, saveSpeakingGuide } from "@/services/speakingService";
import { ContentIssue } from "@/types/examContent";
import { SPEAKING_PARTS } from "@/componenets/exam/speaking";
import ExamContentShell from "./ExamContentShell";
import { cardClass, errorMessage, fieldClass, labelClass } from "./shared";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Admin editor of the "Mündlicher Ausdruck lernen" content: the Redemittel, questions, tips and checklist that every exercise of a Teil
 * shares. Edited as JSON and validated on the server (German only, required sections per Teil) before it is stored.
 */
export default function SpeakingGuideEditor() {
    const queryClient = useQueryClient();
    const [level, setLevel] = useState("B1");
    const [part, setPart] = useState(1);
    const [text, setText] = useState("");
    const [issues, setIssues] = useState<ContentIssue[]>([]);
    const [busy, setBusy] = useState(false);

    const { data: guides, isLoading } = useQuery({
        queryKey: ["admin", "speaking", "guides", level],
        queryFn: () => getSpeakingGuides(level).then((r) => r.data),
    });
    const stored = guides?.find((g) => g.part === part);

    useEffect(() => {
        setText(stored ? JSON.stringify(stored.content, null, 2) : "");
        setIssues([]);
    }, [stored, level, part]);

    const run = async (dryRun: boolean) => {
        let content: unknown;
        try {
            content = JSON.parse(text);
        } catch (err) {
            setIssues([{ severity: "ERROR", code: "JSON_SYNTAX", path: "$", message: `Invalid JSON: ${(err as Error).message}` }]);
            return;
        }
        setBusy(true);
        try {
            const res = await saveSpeakingGuide(level, part, content, dryRun);
            setIssues(res.data.issues);
            if (res.data.saved) {
                toast.success("Lernbereich saved.");
                await queryClient.invalidateQueries({ queryKey: ["admin", "speaking", "guides", level] });
                await queryClient.invalidateQueries({ queryKey: ["speaking", "guides", level] });
            } else if (dryRun && !res.data.issues.some((i) => i.severity === "ERROR")) {
                toast.success("Valid - nothing was saved yet.");
            }
        } catch (err) {
            toast.error(errorMessage(err, "Could not save the Lernbereich."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <ExamContentShell
            title="Sprechen lernen"
            description="The learning area of each Mündlicher Ausdruck Teil: tips, questions, Redemittel and the checklist are written once here and shown next to every exercise of that Teil. German only."
        >
            <div className={`${cardClass} p-6 space-y-4`}>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                        <span className={labelClass}>Level</span>
                        <select className={fieldClass} value={level} onChange={(e) => setLevel(e.target.value)}>
                            {LEVELS.map((l) => <option key={l}>{l}</option>)}
                        </select>
                    </label>
                    <label>
                        <span className={labelClass}>Teil</span>
                        <select className={fieldClass} value={part} onChange={(e) => setPart(Number(e.target.value))}>
                            {SPEAKING_PARTS.map((p) => <option key={p.part} value={p.part}>Teil {p.part} – {p.title}</option>)}
                        </select>
                    </label>
                </div>

                {isLoading ? (
                    <Loading message="Loading..." />
                ) : (
                    <>
                        {!stored && <p className="text-sm text-amber-700 dark:text-amber-300">No Lernbereich exists for {level} Teil {part} yet. Paste the JSON below and save.</p>}
                        <textarea
                            aria-label="Lernbereich JSON"
                            className={`${fieldClass} h-[520px] font-mono text-xs leading-relaxed`}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            spellCheck={false}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" disabled={busy || !text.trim()} onClick={() => run(true)}>Validate</Button>
                            <Button type="button" disabled={busy || !text.trim()} onClick={() => run(false)}>Save</Button>
                        </div>
                        {issues.length > 0 && (
                            <ul className="space-y-1 text-sm" aria-label="Validation results">
                                {issues.map((issue, i) => (
                                    <li key={`${issue.code}-${i}`} className={issue.severity === "ERROR" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}>
                                        <span className="font-semibold">{issue.severity}</span> <code>{issue.path}</code> – {issue.message}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </ExamContentShell>
    );
}
