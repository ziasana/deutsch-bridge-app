"use client";

import Link from "next/link";
import { PromptRequest } from "@/types/examContent";
import Input from "@/componenets/Input";
import { fieldClass, labelClass } from "./shared";

/** DTZ Schreiben (Aufgabe A / Aufgabe B): the generation settings. They guide the AI; they never change the two-task, four-point structure. */
export interface WritingChoiceSettings {
    level: string;
    /** Selected topic tokens or custom topics; empty = random. */
    topics: string[];
    purpose: string;
    format: string;
    pair: string;
    /** Number of exercise sets (A/B pairs) the prompt asks for. */
    count: string;
}

export const DEFAULT_WRITING_CHOICE_SETTINGS: WritingChoiceSettings = {
    level: "A2_B1",
    topics: [],
    purpose: "MIXED",
    format: "MIXED",
    pair: "RANDOM_BALANCED",
    count: "1",
};

export const WC_LEVELS: [string, string][] = [["A2", "A2"], ["A2_B1", "A2–B1"], ["B1", "B1"]];
export const WC_TOPICS: [string, string][] = [
    ["RANDOM", "Random"],
    ["HOUSING_NEIGHBOURS", "Housing and neighbours"],
    ["COURSES_EDUCATION", "Courses and education"],
    ["WORK_EMPLOYMENT", "Work and employment"],
    ["FAMILY_EVERYDAY", "Family and everyday life"],
    ["APPOINTMENTS", "Appointments"],
    ["HEALTH_SERVICES", "Health services"],
    ["PUBLIC_SERVICES", "Public services"],
    ["SHOPPING_COMPLAINTS", "Shopping and complaints"],
    ["INVITATIONS_EVENTS", "Invitations and events"],
    ["TRAVEL_ACCOMMODATION", "Travel and accommodation"],
];
export const WC_PURPOSES: [string, string][] = [
    ["MIXED", "Mixed"],
    ["ENQUIRY_REQUEST", "Enquiry or request"],
    ["COMPLAINT", "Complaint"],
    ["INVITATION_REPLY", "Invitation or reply"],
    ["APPOINTMENT_CHANGE", "Appointment change"],
    ["APPLICATION", "Application"],
    ["PROBLEM_EXPLANATION", "Explanation of a problem"],
    ["REQUEST_FOR_ASSISTANCE", "Request for assistance"],
];
export const WC_FORMATS: [string, string][] = [
    ["MIXED", "Mixed"],
    ["FORMAL", "Formal email or letter"],
    ["INFORMAL_EMAIL", "Informal email"],
    ["SEMI_FORMAL", "Semi-formal email or letter"],
];
export const WC_PAIRS: [string, string][] = [
    ["RANDOM_BALANCED", "Random balanced pair"],
    ["DIFFERENT_TOPICS", "Two different topics"],
    ["DIFFERENT_PURPOSES", "Two different communication purposes"],
    ["FORMAL_AND_INFORMAL", "One formal and one informal/semi-formal task"],
];

const labelOf = (list: [string, string][], value: string) => list.find(([v]) => v === value)?.[1] ?? value;

/** The prompt request for the current settings (exactly one A/B exercise per prompt). */
export function writingChoiceRequest(base: Pick<PromptRequest, "exam" | "level" | "section" | "part">, s: WritingChoiceSettings, notes: string): PromptRequest {
    return {
        ...base,
        count: Math.min(50, Math.max(1, Number.parseInt(s.count, 10) || 1)),
        difficulty: s.level,
        topics: s.topics,
        notes: notes.trim() || undefined,
        textType: s.purpose,
        communicationType: s.format,
        pairPreference: s.pair,
    };
}

export function WritingChoiceSettingsForm({ value, onChange, renderTopics }: Readonly<{
    value: WritingChoiceSettings;
    onChange: (next: WritingChoiceSettings) => void;
    /** The selectable topic chips (with the saved custom topics), supplied by the generator page. */
    renderTopics: (selected: string[], onChange: (topics: string[]) => void) => React.ReactNode;
}>) {
    const set = (patch: Partial<WritingChoiceSettings>) => onChange({ ...value, ...patch });
    const select = (label: string, key: keyof WritingChoiceSettings, list: [string, string][], span = false) => (
        <label className={span ? "col-span-2" : undefined}>
            <span className={labelClass}>{label}</span>
            <select className={fieldClass} value={value[key]} onChange={(e) => set({ [key]: e.target.value })}>
                {list.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </label>
    );
    return (
        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generation settings</h3>
            <div className="grid grid-cols-2 gap-3">
                <label>
                    <span className={labelClass}>Number of exercise sets</span>
                    <Input type="number" min={1} max={50} value={value.count} onChange={(e) => set({ count: e.target.value })} />
                </label>
                {select("Difficulty", "level", WC_LEVELS)}
                {select("Communication purpose", "purpose", WC_PURPOSES)}
                {select("Communication format", "format", WC_FORMATS)}
                {select("Pair-generation preference", "pair", WC_PAIRS, true)}
            </div>
            <fieldset>
                <legend className={labelClass}>Topic {value.topics.length === 0 && <span className="font-normal text-gray-500">(random)</span>}</legend>
                {renderTopics(value.topics, (topics) => set({ topics }))}
            </fieldset>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Fixed by the DTZ format: each exercise set has two alternatives, Aufgabe A and Aufgabe B, exactly four content points each and 30 minutes.
                The settings only guide the content; if they cannot be satisfied together, the prompt gives priority to the structure and to clear, realistic B1 communication.
                With more than one set the AI returns one batch file. Imported content is always saved as a draft.
            </p>
        </div>
    );
}

/** The summary, the German usage hint and the next steps shown below the generated prompt. */
export function WritingChoicePromptNotes({ settings }: Readonly<{ settings: WritingChoiceSettings }>) {
    return (
        <div className="mt-3 space-y-3">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-3">
                <div><dt className="text-xs text-gray-500">Topic</dt><dd>{settings.topics.length ? settings.topics.map((t) => labelOf(WC_TOPICS, t)).join(", ") : "Random"}</dd></div>
                <div><dt className="text-xs text-gray-500">Purpose</dt><dd>{labelOf(WC_PURPOSES, settings.purpose)}</dd></div>
                <div><dt className="text-xs text-gray-500">Format</dt><dd>{labelOf(WC_FORMATS, settings.format)}</dd></div>
                <div><dt className="text-xs text-gray-500">Difficulty</dt><dd>{labelOf(WC_LEVELS, settings.level)}</dd></div>
                <div><dt className="text-xs text-gray-500">Pair</dt><dd>{labelOf(WC_PAIRS, settings.pair)}</dd></div>
                <div><dt className="text-xs text-gray-500">Exercise sets</dt><dd>{settings.count}</dd></div>
                <div><dt className="text-xs text-gray-500">Structure</dt><dd>Aufgabe A + B · 4 points each · 30 min</dd></div>
            </dl>
            <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                ℹ️ Hinweis: Kopieren Sie den Prompt und verwenden Sie ihn in ChatGPT, Claude, Gemini oder einem anderen KI-Tool. Lassen Sie ein vollständiges JSON mit Aufgabe A und
                Aufgabe B erstellen. Speichern Sie die JSON-Ausgabe als Datei und laden Sie sie hier hoch. Prüfen Sie beide Aufgaben und alle acht Inhaltspunkte vor der Veröffentlichung.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                <li>Copy the prompt and paste it into an external AI tool.</li>
                <li>Save the AI&apos;s answer as a <code>.json</code> file (only the JSON object, no Markdown).</li>
                <li>Upload the file on the <Link href="/admin/exam-prep/import" className="underline text-blue-600 dark:text-blue-400">Import JSON</Link> page, check errors, warnings and the preview.</li>
                <li>Import it as a draft, edit the situations and the eight points if needed, and publish it after you have read both tasks yourself.</li>
            </ol>
        </div>
    );
}
