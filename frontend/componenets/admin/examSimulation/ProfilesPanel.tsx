"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Copy, Plus, Save } from "lucide-react";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { simulationError, simulationErrorMessage } from "@/lib/examSimulation";
import {
    adminArchiveExamProfile,
    adminCreateExamProfile,
    adminDeactivateExamProfile,
    adminDuplicateExamProfile,
    adminExamProfileAudit,
    adminExamProfileAvailability,
    adminListExamProfiles,
    adminPublishExamProfile,
    adminUpdateExamProfile,
    adminValidateExamProfile,
} from "@/services/adminExamSimulationService";
import type { ExamProfileRequest, ExamProfileResponse, ValidationIssue, ValidationResponse } from "@/types/examSimulation";
import { BTN, BTN_PRIMARY, INPUT } from "./fields";
import ProfileEditor, { EMPTY_PROFILE } from "./ProfileEditor";

const STATUS_STYLE: Record<string, string> = {
    DRAFT: "bg-foreground/10 text-foreground/70",
    PUBLISHED: "bg-green-500/15 text-green-700 dark:text-green-400",
    DEACTIVATED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    ARCHIVED: "bg-red-500/10 text-red-700 dark:text-red-400",
};
const STATUS_LABEL: Record<string, string> = { DRAFT: "Entwurf", PUBLISHED: "Veröffentlicht", DEACTIVATED: "Deaktiviert", ARCHIVED: "Archiviert" };

const toRequest = (p: ExamProfileResponse): ExamProfileRequest => ({
    code: p.code,
    provider: p.provider,
    examName: p.examName,
    title: p.title,
    description: p.description,
    examType: p.examType,
    level: p.level,
    oralScoringEnabled: p.oralScoringEnabled,
    writtenMaxPoints: p.writtenMaxPoints,
    writtenPassThreshold: p.writtenPassThreshold,
    oralMaxPoints: p.oralMaxPoints,
    oralPassThreshold: p.oralPassThreshold,
    overallResultPolicy: p.overallResultPolicy,
    answerReleasePolicy: p.answerReleasePolicy,
    maxResumes: p.maxResumes,
    excludePracticedExercises: p.excludePracticedExercises,
    config: p.config,
});

function IssueList({ issues, tone }: Readonly<{ issues: ValidationIssue[]; tone: "error" | "warning" }>) {
    if (issues.length === 0) return null;
    return (
        <ul className={`space-y-1 rounded-lg px-4 py-3 text-sm ${tone === "error" ? "bg-red-500/10 text-red-800 dark:text-red-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300"}`}>
            {issues.map((i, idx) => (
                <li key={idx} className="list-none">
                    <span className="font-mono text-xs opacity-70">{i.code}</span> {i.message}
                </li>
            ))}
        </ul>
    );
}

function Detail({ profile, onClose }: Readonly<{ profile: ExamProfileResponse | null; onClose: (savedId?: string) => void }>) {
    const queryClient = useQueryClient();
    const creating = profile == null;
    const [draft, setDraft] = useState<ExamProfileRequest>(profile ? toRequest(profile) : EMPTY_PROFILE);
    const [validation, setValidation] = useState<ValidationResponse | null>(null);
    const [note, setNote] = useState(profile?.verificationNote ?? "");
    const [confirm, setConfirm] = useState<"deactivate" | "archive" | null>(null);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-exam-profiles"] });
    const fail = (fallback: string) => (error: unknown) => {
        const body = simulationError(error);
        const issues = (body?.details?.errors ?? null) as ValidationIssue[] | null;
        if (issues) setValidation({ valid: false, errors: issues, warnings: [] });
        toast.error(simulationErrorMessage(error, fallback));
    };

    const availability = useQuery({
        queryKey: ["admin-exam-profile-availability", profile?.id],
        queryFn: () => adminExamProfileAvailability(profile!.id).then((r) => r.data),
        enabled: !!profile,
    });
    const audit = useQuery({
        queryKey: ["admin-exam-profile-audit", profile?.id],
        queryFn: () => adminExamProfileAudit(profile!.id).then((r) => r.data),
        enabled: !!profile,
    });

    const save = useMutation({
        mutationFn: () => (creating ? adminCreateExamProfile(draft) : adminUpdateExamProfile(profile.id, draft)),
        onSuccess: (res) => {
            toast.success("Profil gespeichert.");
            void refresh();
            onClose(res.data.id);
        },
        onError: fail("Das Profil konnte nicht gespeichert werden."),
    });
    const validate = useMutation({
        mutationFn: () => adminValidateExamProfile(profile!.id),
        onSuccess: (res) => setValidation(res.data),
        onError: fail("Die Prüfung ist fehlgeschlagen."),
    });
    const publish = useMutation({
        mutationFn: () => adminPublishExamProfile(profile!.id, note),
        onSuccess: () => {
            toast.success("Profil veröffentlicht.");
            setValidation(null);
            void refresh();
        },
        onError: fail("Das Profil konnte nicht veröffentlicht werden."),
    });
    const duplicate = useMutation({
        mutationFn: () => adminDuplicateExamProfile(profile!.id),
        onSuccess: (res) => {
            toast.success(`Neue Version ${res.data.version} als Entwurf angelegt.`);
            void refresh();
            onClose(res.data.id);
        },
        onError: fail("Das Profil konnte nicht dupliziert werden."),
    });
    const transition = useMutation({
        mutationFn: (kind: "deactivate" | "archive") => (kind === "deactivate" ? adminDeactivateExamProfile(profile!.id) : adminArchiveExamProfile(profile!.id)),
        onSuccess: () => void refresh(),
        onError: fail("Der Status konnte nicht geändert werden."),
        onSettled: () => setConfirm(null),
    });

    const readOnly = !creating && !profile.editable;
    return (
        <section className="space-y-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm" aria-label="Profil bearbeiten">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">
                    {creating ? "Neues Profil" : `${profile.title} · Version ${profile.version}`}
                    {!creating && <span className={`ms-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[profile.status]}`}>{STATUS_LABEL[profile.status]}</span>}
                </h2>
                <div className="flex flex-wrap gap-2">
                    {!creating && <button type="button" className={BTN} onClick={() => duplicate.mutate()} disabled={duplicate.isPending}><Copy className="size-4" /> Duplizieren (neue Version)</button>}
                    {!creating && profile.status === "PUBLISHED" && <button type="button" className={BTN} onClick={() => setConfirm("deactivate")}>Deaktivieren</button>}
                    {!creating && profile.status !== "ARCHIVED" && <button type="button" className={BTN} onClick={() => setConfirm("archive")}>Archivieren</button>}
                    <button type="button" className={BTN} onClick={() => onClose()}>Schließen</button>
                </div>
            </header>

            {readOnly && <p className="rounded-lg bg-accent/50 px-4 py-2 text-sm text-foreground/70">Veröffentlichte Versionen sind unveränderlich. Dupliziere das Profil, um eine neue Version zu bearbeiten.</p>}

            <ProfileEditor value={draft} onChange={setDraft} codeEditable={creating} readOnly={readOnly} />

            {!readOnly && (
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={BTN_PRIMARY} disabled={save.isPending} onClick={() => save.mutate()}><Save className="size-4" /> Speichern</button>
                </div>
            )}

            {!creating && profile.status !== "ARCHIVED" && (
                <div className="space-y-3 border-t border-border/60 pt-5">
                    <h3 className="text-sm font-bold text-foreground">Prüfen und veröffentlichen</h3>
                    <p className="text-xs text-foreground/60">Gespeicherte Änderungen werden geprüft: Punktesummen, Raster, Zeitabschnitte und ob genug veröffentlichte Aufgaben vorhanden sind.</p>
                    <div className="flex flex-wrap items-end gap-2">
                        <button type="button" className={BTN} onClick={() => validate.mutate()} disabled={validate.isPending}><CheckCircle2 className="size-4" /> Profil prüfen</button>
                        {profile.status !== "PUBLISHED" && (
                            <>
                                <input aria-label="Verifizierungsnotiz" className={`${INPUT} max-w-md`} placeholder="Gegen welche offizielle Prüfungsordnung geprüft? (Pflicht)" value={note} onChange={(e) => setNote(e.target.value)} />
                                <button type="button" className={BTN_PRIMARY} onClick={() => publish.mutate()} disabled={publish.isPending || note.trim() === ""}>Veröffentlichen</button>
                            </>
                        )}
                    </div>
                    {profile.verificationNote && <p className="text-xs text-foreground/60">Verifizierung: {profile.verificationNote}</p>}
                    {validation && (
                        <div className="space-y-2" role="status">
                            {validation.valid ? <p className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400"><CheckCircle2 className="size-4" /> Keine Fehler gefunden.</p> : <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400"><AlertTriangle className="size-4" /> Das Profil kann nicht veröffentlicht werden.</p>}
                            <IssueList issues={validation.errors} tone="error" />
                            <IssueList issues={validation.warnings} tone="warning" />
                        </div>
                    )}
                </div>
            )}

            {!creating && availability.data && (
                <div className="space-y-2 border-t border-border/60 pt-5">
                    <h3 className="text-sm font-bold text-foreground">Verfügbare Aufgaben je Teil</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[32rem] text-sm">
                            <thead>
                                <tr className="text-xs text-foreground/60">
                                    <th className="p-1 text-start">Teil</th>
                                    <th className="p-1 text-end">Benötigt</th>
                                    <th className="p-1 text-end">Geeignet (veröffentlicht)</th>
                                    <th className="p-1 text-end">Übrig für Lernende mit dem höchsten Verbrauch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availability.data.parts.map((p) => (
                                    <tr key={p.partKey} className="border-t border-border/50">
                                        <td className="p-1">{p.label}</td>
                                        <td className="p-1 text-end tabular-nums">{p.required}</td>
                                        <td className={`p-1 text-end tabular-nums ${p.eligible < p.required ? "font-bold text-red-600" : ""}`}>{p.eligible}</td>
                                        <td className={`p-1 text-end tabular-nums ${p.minRemainingAcrossUsers < p.required ? "font-bold text-amber-700 dark:text-amber-400" : ""}`}>{p.minRemainingAcrossUsers}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!creating && audit.data && audit.data.length > 0 && (
                <details className="border-t border-border/60 pt-4 text-sm">
                    <summary className="cursor-pointer font-semibold">Änderungsverlauf ({audit.data.length})</summary>
                    <ul className="mt-2 space-y-1 text-xs text-foreground/70">
                        {audit.data.map((a) => (
                            <li key={a.id} className="list-none">
                                {new Date(a.occurredAt).toLocaleString("de-DE")} · {a.action}
                                {a.fromState || a.toState ? ` (${a.fromState ?? "–"} → ${a.toState ?? "–"})` : ""} · {a.actor}
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            <ConfirmDialog
                isOpen={confirm !== null}
                title={confirm === "archive" ? "Profil archivieren?" : "Profil deaktivieren?"}
                message={confirm === "archive" ? "Archivierte Profile können nicht mehr gestartet werden. Bestehende Ergebnisse bleiben erhalten." : "Lernende können keine neue Prüfung mit diesem Profil mehr starten. Laufende Prüfungen laufen weiter."}
                confirmLabel="Bestätigen"
                cancelLabel="Abbrechen"
                onConfirm={() => confirm && transition.mutate(confirm)}
                onCancel={() => setConfirm(null)}
            />
        </section>
    );
}

export default function ProfilesPanel() {
    const { data, isLoading } = useQuery({ queryKey: ["admin-exam-profiles"], queryFn: () => adminListExamProfiles().then((r) => r.data) });
    const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
    if (isLoading) return <Loading />;
    const profiles = data ?? [];
    const selected = selectedId && selectedId !== "new" ? (profiles.find((p) => p.id === selectedId) ?? null) : null;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button type="button" className={BTN_PRIMARY} onClick={() => setSelectedId("new")}><Plus className="size-4" /> Neues Profil</button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
                <table className="w-full min-w-[40rem] text-sm">
                    <thead>
                        <tr className="text-xs uppercase tracking-wide text-foreground/50">
                            <th className="p-3 text-start font-medium">Profil</th>
                            <th className="p-3 text-start font-medium">Niveau</th>
                            <th className="p-3 text-end font-medium">Version</th>
                            <th className="p-3 text-start font-medium">Status</th>
                            <th className="p-3 text-end font-medium">Punkte</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((p) => (
                            <tr key={p.id} onClick={() => setSelectedId(p.id)} className={`cursor-pointer border-t border-border/50 hover:bg-accent/40 ${selectedId === p.id ? "bg-accent/50" : ""}`}>
                                <td className="p-3"><span className="font-semibold">{p.title}</span><span className="block text-xs text-foreground/50">{p.code}</span></td>
                                <td className="p-3">{p.level}</td>
                                <td className="p-3 text-end tabular-nums">{p.version}</td>
                                <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                                <td className="p-3 text-end tabular-nums">{p.totalMaxPoints}</td>
                            </tr>
                        ))}
                        {profiles.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-foreground/60">Noch keine Profile.</td></tr>}
                    </tbody>
                </table>
            </div>
            {selectedId && <Detail key={selectedId} profile={selected} onClose={(savedId) => setSelectedId(savedId ?? null)} />}
        </div>
    );
}
