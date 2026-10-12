"use client";

import { Plus, Trash2 } from "lucide-react";
import Toggle from "@/componenets/admin/Toggle";
import { BTN, Field, INPUT, NumberInput } from "./fields";
import type { ExamPartConfig, ExamProfileRequest, ExamTimerConfig, RubricCriterion } from "@/types/examSimulation";

const SECTIONS = ["LESEVERSTEHEN", "SPRACHBAUSTEINE", "HOERVERSTEHEN", "SCHRIFTLICHER_AUSDRUCK", "MUENDLICHER_AUSDRUCK"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ROUNDING = ["HALF_UP", "HALF_DOWN", "HALF_EVEN", "UP", "DOWN", "CEILING", "FLOOR"];

export const EMPTY_PART: ExamPartConfig = {
    key: "",
    label: "",
    module: "WRITTEN",
    section: "LESEVERSTEHEN",
    teil: 1,
    taskTypes: null,
    exerciseCount: 1,
    questionCount: 5,
    pointsPerQuestion: 5,
    maxPoints: 25,
    scoringMethod: "PER_QUESTION",
    timerKey: "",
    rubric: null,
};

export const EMPTY_PROFILE: ExamProfileRequest = {
    code: "",
    provider: "",
    examName: "",
    title: "",
    description: null,
    examType: "TELC",
    level: "B1",
    oralScoringEnabled: false,
    writtenMaxPoints: 0,
    writtenPassThreshold: 0,
    oralMaxPoints: 0,
    oralPassThreshold: 0,
    overallResultPolicy: "WRITTEN_AND_ORAL_REQUIRED",
    answerReleasePolicy: "AFTER_SUBMISSION",
    maxResumes: null,
    excludePracticedExercises: false,
    config: { parts: [], timers: [], scoreScale: 1, roundingMode: "HALF_UP" },
};

interface Props {
    value: ExamProfileRequest;
    onChange: (next: ExamProfileRequest) => void;
    /** Code is only editable while creating; published versions are read-only altogether. */
    codeEditable: boolean;
    readOnly: boolean;
}

/** Form for an exam profile: identity, rules, ordered parts with point mappings and rubrics, and ordered timers. */
export default function ProfileEditor({ value, onChange, codeEditable, readOnly }: Readonly<Props>) {
    const set = <K extends keyof ExamProfileRequest>(key: K, v: ExamProfileRequest[K]) => onChange({ ...value, [key]: v });
    const parts = value.config.parts;
    const timers = value.config.timers;
    const setParts = (next: ExamPartConfig[]) => onChange({ ...value, config: { ...value.config, parts: next } });
    const setTimers = (next: ExamTimerConfig[]) => onChange({ ...value, config: { ...value.config, timers: next } });
    const patchPart = (i: number, patch: Partial<ExamPartConfig>) => setParts(parts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
    const patchTimer = (i: number, patch: Partial<ExamTimerConfig>) => setTimers(timers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
    const move = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
        const j = i + dir;
        if (j < 0 || j >= list.length) return list;
        const copy = [...list];
        [copy[i], copy[j]] = [copy[j], copy[i]];
        return copy;
    };
    const writtenSum = parts.filter((p) => p.module === "WRITTEN").reduce((s, p) => s + (p.maxPoints || 0), 0);
    const oralSum = parts.filter((p) => p.module === "ORAL").reduce((s, p) => s + (p.maxPoints || 0), 0);

    return (
        <div className="space-y-8">
            <fieldset disabled={readOnly} className="space-y-4">
                <legend className="text-sm font-bold text-foreground">Identität</legend>
                <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Profil-Code (unveränderlich)">
                        <input className={INPUT} value={value.code} disabled={!codeEditable || readOnly} onChange={(e) => set("code", e.target.value)} />
                    </Field>
                    <Field label="Anbieter">
                        <input className={INPUT} value={value.provider} onChange={(e) => set("provider", e.target.value)} />
                    </Field>
                    <Field label="Prüfungsname">
                        <input className={INPUT} value={value.examName} onChange={(e) => set("examName", e.target.value)} />
                    </Field>
                    <Field label="Titel" className="md:col-span-2">
                        <input className={INPUT} value={value.title} onChange={(e) => set("title", e.target.value)} />
                    </Field>
                    <Field label="Niveau">
                        <select className={INPUT} value={value.level} onChange={(e) => set("level", e.target.value)}>
                            {LEVELS.map((l) => (
                                <option key={l}>{l}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Beschreibung" className="md:col-span-3">
                        <textarea className={INPUT} rows={2} value={value.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
                    </Field>
                </div>
            </fieldset>

            <fieldset disabled={readOnly} className="space-y-4">
                <legend className="text-sm font-bold text-foreground">Punkte und Bestehen</legend>
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label={`Schriftlich max. (Teile: ${writtenSum})`}>
                        <NumberInput label="Schriftlich max." value={value.writtenMaxPoints} onChange={(v) => set("writtenMaxPoints", v ?? 0)} />
                    </Field>
                    <Field label="Schriftlich bestanden ab">
                        <NumberInput label="Schriftlich Bestehensgrenze" value={value.writtenPassThreshold} onChange={(v) => set("writtenPassThreshold", v ?? 0)} />
                    </Field>
                    <Field label={`Mündlich max. (Teile: ${oralSum})`}>
                        <NumberInput label="Mündlich max." value={value.oralMaxPoints} onChange={(v) => set("oralMaxPoints", v ?? 0)} />
                    </Field>
                    <Field label="Mündlich bestanden ab">
                        <NumberInput label="Mündlich Bestehensgrenze" value={value.oralPassThreshold} onChange={(v) => set("oralPassThreshold", v ?? 0)} />
                    </Field>
                    <Field label="Gesamtergebnis">
                        <select className={INPUT} value={value.overallResultPolicy} onChange={(e) => set("overallResultPolicy", e.target.value as ExamProfileRequest["overallResultPolicy"])}>
                            <option value="WRITTEN_AND_ORAL_REQUIRED">Schriftlich und mündlich nötig</option>
                            <option value="WRITTEN_ONLY">Nur schriftlich entscheidet</option>
                        </select>
                    </Field>
                    <Field label="Lösungen anzeigen">
                        <select className={INPUT} value={value.answerReleasePolicy} onChange={(e) => set("answerReleasePolicy", e.target.value as ExamProfileRequest["answerReleasePolicy"])}>
                            <option value="AFTER_SUBMISSION">Nach der Abgabe</option>
                            <option value="AFTER_ASSESSMENT">Nach vollständiger Bewertung</option>
                            <option value="SCORE_ONLY">Nie (nur Punkte)</option>
                        </select>
                    </Field>
                    <Field label="Rundung (Stellen / Modus)">
                        <div className="flex gap-2">
                            <input aria-label="Nachkommastellen" type="number" min={0} max={3} className={INPUT} value={value.config.scoreScale ?? 1} onChange={(e) => onChange({ ...value, config: { ...value.config, scoreScale: Number(e.target.value) } })} />
                            <select aria-label="Rundungsmodus" className={INPUT} value={value.config.roundingMode ?? "HALF_UP"} onChange={(e) => onChange({ ...value, config: { ...value.config, roundingMode: e.target.value } })}>
                                {ROUNDING.map((r) => (
                                    <option key={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </Field>
                    <Field label="Max. Wiedereinstiege (leer = unbegrenzt)">
                        <NumberInput label="Max. Wiedereinstiege" step="1" value={value.maxResumes} onChange={(v) => set("maxResumes", v)} />
                    </Field>
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                    <label className="flex items-center gap-2">
                        <Toggle checked={value.oralScoringEnabled} onChange={(v) => set("oralScoringEnabled", v)} disabled={readOnly} />
                        Mündliche Bewertung aktiv (manuell)
                    </label>
                    <label className="flex items-center gap-2">
                        <Toggle checked={value.excludePracticedExercises} onChange={(v) => set("excludePracticedExercises", v)} disabled={readOnly} />
                        In der Übung abgeschlossene Aufgaben ausschließen
                    </label>
                </div>
            </fieldset>

            <fieldset disabled={readOnly} className="space-y-3">
                <legend className="text-sm font-bold text-foreground">Zeitabschnitte (Reihenfolge = Ablauf)</legend>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[44rem] text-sm">
                        <thead>
                            <tr className="text-xs text-foreground/60">
                                <th className="p-1 text-start">Schlüssel</th>
                                <th className="p-1 text-start">Bezeichnung</th>
                                <th className="p-1 text-start">Minuten</th>
                                <th className="p-1 text-start">Art</th>
                                <th className="p-1 text-start">Zeigt Aufgaben von</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {timers.map((t, i) => (
                                <tr key={i}>
                                    <td className="p-1"><input aria-label="Timer-Schlüssel" className={INPUT} value={t.key} onChange={(e) => patchTimer(i, { key: e.target.value })} /></td>
                                    <td className="p-1"><input aria-label="Timer-Bezeichnung" className={INPUT} value={t.label} onChange={(e) => patchTimer(i, { label: e.target.value })} /></td>
                                    <td className="p-1"><NumberInput label="Minuten" step="1" value={t.minutes} onChange={(v) => patchTimer(i, { minutes: v ?? 0 })} /></td>
                                    <td className="p-1">
                                        <select aria-label="Timer-Art" className={INPUT} value={t.kind ?? "WORKING"} onChange={(e) => patchTimer(i, { kind: e.target.value as ExamTimerConfig["kind"] })}>
                                            <option value="WORKING">Bearbeitung</option>
                                            <option value="PREPARATION">Vorbereitung</option>
                                        </select>
                                    </td>
                                    <td className="p-1"><input aria-label="Vorschau-Timer" className={INPUT} disabled={t.kind !== "PREPARATION"} value={t.previewTimerKey ?? ""} onChange={(e) => patchTimer(i, { previewTimerKey: e.target.value || null })} /></td>
                                    <td className="whitespace-nowrap p-1 text-end">
                                        <button type="button" className={BTN} onClick={() => setTimers(move(timers, i, -1))} aria-label="Nach oben">↑</button>{" "}
                                        <button type="button" className={BTN} onClick={() => setTimers(move(timers, i, 1))} aria-label="Nach unten">↓</button>{" "}
                                        <button type="button" className={BTN} onClick={() => setTimers(timers.filter((_, idx) => idx !== i))} aria-label="Timer entfernen"><Trash2 className="size-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" className={BTN} onClick={() => setTimers([...timers, { key: "", label: "", minutes: 30, kind: "WORKING", previewTimerKey: null }])}>
                    <Plus className="size-4" /> Zeitabschnitt
                </button>
            </fieldset>

            <fieldset disabled={readOnly} className="space-y-3">
                <legend className="text-sm font-bold text-foreground">Prüfungsteile (Reihenfolge = Prüfungsreihenfolge)</legend>
                {parts.map((p, i) => (
                    <div key={i} className="space-y-3 rounded-xl border border-border/70 p-3">
                        <div className="grid gap-2 md:grid-cols-6">
                            <Field label="Schlüssel"><input className={INPUT} value={p.key} onChange={(e) => patchPart(i, { key: e.target.value })} /></Field>
                            <Field label="Bezeichnung" className="md:col-span-2"><input className={INPUT} value={p.label} onChange={(e) => patchPart(i, { label: e.target.value })} /></Field>
                            <Field label="Bereich">
                                <select className={INPUT} value={p.module} onChange={(e) => patchPart(i, { module: e.target.value as ExamPartConfig["module"] })}>
                                    <option value="WRITTEN">Schriftlich</option>
                                    <option value="ORAL">Mündlich</option>
                                </select>
                            </Field>
                            <Field label="Aufgabenbereich">
                                <select className={INPUT} value={p.section} onChange={(e) => patchPart(i, { section: e.target.value as ExamPartConfig["section"] })}>
                                    {SECTIONS.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Teil"><NumberInput label="Teil" step="1" value={p.teil} onChange={(v) => patchPart(i, { teil: v ?? 1 })} /></Field>
                            <Field label="Bewertung">
                                <select className={INPUT} value={p.scoringMethod} onChange={(e) => patchPart(i, { scoringMethod: e.target.value as ExamPartConfig["scoringMethod"] })}>
                                    <option value="PER_QUESTION">Automatisch je Frage</option>
                                    <option value="MANUAL_RUBRIC">Manuell (Raster)</option>
                                    <option value="UNSCORED">Nicht bewertet</option>
                                </select>
                            </Field>
                            <Field label="Fragen"><NumberInput label="Fragen" step="1" disabled={p.scoringMethod !== "PER_QUESTION"} value={p.questionCount} onChange={(v) => patchPart(i, { questionCount: v })} /></Field>
                            <Field label="Punkte je Frage"><NumberInput label="Punkte je Frage" disabled={p.scoringMethod !== "PER_QUESTION"} value={p.pointsPerQuestion} onChange={(v) => patchPart(i, { pointsPerQuestion: v })} /></Field>
                            <Field label="Max. Punkte"><NumberInput label="Max. Punkte" value={p.maxPoints} onChange={(v) => patchPart(i, { maxPoints: v ?? 0 })} /></Field>
                            <Field label="Aufgaben im Teil"><NumberInput label="Aufgaben im Teil" step="1" value={p.exerciseCount} onChange={(v) => patchPart(i, { exerciseCount: v ?? 1 })} /></Field>
                            <Field label="Zeitabschnitt">
                                <select className={INPUT} value={p.timerKey} onChange={(e) => patchPart(i, { timerKey: e.target.value })}>
                                    <option value="">–</option>
                                    {timers.filter((t) => t.kind !== "PREPARATION").map((t) => (
                                        <option key={t.key} value={t.key}>{t.key}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        {p.scoringMethod === "MANUAL_RUBRIC" && (
                            <RubricEditor rubric={p.rubric ?? []} max={p.maxPoints} onChange={(rubric) => patchPart(i, { rubric })} />
                        )}
                        <div className="flex justify-end gap-2">
                            <button type="button" className={BTN} onClick={() => setParts(move(parts, i, -1))} aria-label="Nach oben">↑</button>
                            <button type="button" className={BTN} onClick={() => setParts(move(parts, i, 1))} aria-label="Nach unten">↓</button>
                            <button type="button" className={BTN} onClick={() => setParts(parts.filter((_, idx) => idx !== i))}><Trash2 className="size-4" /> Teil entfernen</button>
                        </div>
                    </div>
                ))}
                <button type="button" className={BTN} onClick={() => setParts([...parts, { ...EMPTY_PART, timerKey: timers.find((t) => t.kind !== "PREPARATION")?.key ?? "" }])}>
                    <Plus className="size-4" /> Teil hinzufügen
                </button>
            </fieldset>
        </div>
    );
}

function RubricEditor({ rubric, max, onChange }: Readonly<{ rubric: RubricCriterion[]; max: number; onChange: (r: RubricCriterion[]) => void }>) {
    const sum = rubric.reduce((s, c) => s + (c.maxPoints || 0), 0);
    const patch = (i: number, p: Partial<RubricCriterion>) => onChange(rubric.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
    return (
        <div className="rounded-lg bg-accent/30 p-3">
            <p className={`text-xs font-semibold ${sum === max ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                Bewertungsraster: Summe {sum} von {max} Punkten
            </p>
            <div className="mt-2 space-y-2">
                {rubric.map((c, i) => (
                    <div key={i} className="grid gap-2 md:grid-cols-[10rem_1fr_6rem_auto]">
                        <input aria-label="Kriterium-Schlüssel" className={INPUT} placeholder="Schlüssel" value={c.key} onChange={(e) => patch(i, { key: e.target.value })} />
                        <input aria-label="Kriterium-Bezeichnung" className={INPUT} placeholder="Bezeichnung" value={c.label} onChange={(e) => patch(i, { label: e.target.value })} />
                        <NumberInput label="Kriterium max." value={c.maxPoints} onChange={(v) => patch(i, { maxPoints: v ?? 0 })} />
                        <button type="button" className={BTN} aria-label="Kriterium entfernen" onClick={() => onChange(rubric.filter((_, idx) => idx !== i))}><Trash2 className="size-4" /></button>
                    </div>
                ))}
            </div>
            <button type="button" className={`${BTN} mt-2`} onClick={() => onChange([...rubric, { key: "", label: "", maxPoints: 0 }])}><Plus className="size-4" /> Kriterium</button>
        </div>
    );
}
