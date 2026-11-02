"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, CheckCircle2, ChevronDown, Dices, Eye, FilePlus2, Trash2 } from "lucide-react";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { simulationErrorMessage } from "@/lib/examSimulation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    adminDiscardExamSet,
    adminExamProfileAvailability,
    adminGenerateExamSet,
    adminListExamProfiles,
    adminListExamSets,
    adminPublishExamSet,
} from "@/services/adminExamSimulationService";
import type { AdminExamSet, ExamProfileResponse } from "@/types/examSimulation";
import { BTN, BTN_PRIMARY } from "./fields";

function PartList({ set }: Readonly<{ set: AdminExamSet }>) {
    return (
        <ul className="grid gap-x-6 gap-y-1.5 p-0 text-sm sm:grid-cols-2">
            {set.parts.map((p) => (
                <li key={`${p.partKey}-${p.ordinal}`} className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1 list-none">
                    <span className="shrink-0 text-xs font-medium text-foreground/60">{p.partLabel}</span>
                    <span className={cn("truncate text-end", !p.exerciseAvailable && "font-semibold text-red-600")} title={p.exerciseTitle ?? p.exerciseId}>
                        {p.exerciseTitle ?? p.exerciseId}
                        {!p.exerciseAvailable && " · nicht mehr verwendbar"}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** A draft waits for a decision: look at the exercises, then publish, re-roll or discard. */
function DraftCard({ set, warnings, busy, onPublish, onReroll, onDiscard }: Readonly<{ set: AdminExamSet; warnings: string[]; busy: boolean; onPublish: () => void; onReroll: () => void; onDiscard: () => void }>) {
    const broken = set.parts.some((p) => !p.exerciseAvailable);
    return (
        <article className="space-y-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 p-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Entwurf – noch nicht für Lernende sichtbar</p>
                    <h3 className="text-lg font-bold text-foreground">{set.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={BTN_PRIMARY} disabled={busy || broken} onClick={onPublish}><CheckCircle2 className="size-4" /> Veröffentlichen</button>
                    <button type="button" className={BTN} disabled={busy} onClick={onReroll}><Dices className="size-4" /> Neu würfeln</button>
                    <button type="button" className={BTN} disabled={busy} onClick={onDiscard}><Trash2 className="size-4" /> Verwerfen</button>
                </div>
            </header>
            {warnings.length > 0 && (
                <ul className="space-y-1 rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
                    {warnings.map((w) => (
                        <li key={w} className="flex items-start gap-2 list-none"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {w}</li>
                    ))}
                </ul>
            )}
            <PartList set={set} />
        </article>
    );
}

function PublishedCard({ set, onArchive }: Readonly<{ set: AdminExamSet; onArchive: () => void }>) {
    const [open, setOpen] = useState(false);
    return (
        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-lg font-extrabold text-primary-foreground">{set.number}</span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-foreground">{set.title}</h3>
                    <p className="text-xs text-foreground/60">Veröffentlicht {set.publishedAt ? new Date(set.publishedAt).toLocaleDateString("de-DE") : ""}</p>
                </div>
                <button type="button" aria-expanded={open} aria-label="Aufgaben anzeigen" className={BTN} onClick={() => setOpen((v) => !v)}>
                    <Eye className="size-4" /> <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
                </button>
                <button type="button" aria-label={`${set.title} archivieren`} className={BTN} onClick={onArchive}><Archive className="size-4" /></button>
            </div>
            {open && <div className="mt-3 border-t border-border/50 pt-3"><PartList set={set} /></div>}
        </article>
    );
}

/** Per part: how many eligible exercises exist and how many are still in no exam. Tells the admin when content runs out. */
function ContentHealth({ profile }: Readonly<{ profile: ExamProfileResponse }>) {
    const availability = useQuery({
        queryKey: ["admin-exam-profile-availability", profile.id],
        queryFn: () => adminExamProfileAvailability(profile.id).then((r) => r.data),
    });
    const parts = availability.data?.parts ?? [];
    const missing = parts.filter((p) => p.eligible < p.required);
    const reused = parts.filter((p) => p.eligible >= p.required && p.minRemainingAcrossUsers < p.required);
    if (parts.length === 0) return null;
    const tone = missing.length > 0 ? "red" : reused.length > 0 ? "amber" : "green";
    return (
        <details open={tone !== "green"} className={cn("rounded-2xl border p-4 text-sm", tone === "red" ? "border-red-500/40 bg-red-500/5" : tone === "amber" ? "border-amber-500/40 bg-amber-500/5" : "border-border/70 bg-card")}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-semibold text-foreground">
                {tone === "green" ? <CheckCircle2 className="size-4 text-green-600" aria-hidden /> : <AlertTriangle className={cn("size-4", tone === "red" ? "text-red-600" : "text-amber-600")} aria-hidden />}
                {missing.length > 0 && `Zu wenig Aufgaben in ${missing.length} Teil(en) – es kann keine Prüfung erstellt werden.`}
                {missing.length === 0 && reused.length > 0 && `In ${reused.length} Teil(en) sind alle Aufgaben schon verwendet – neue Prüfungen wiederholen Aufgaben.`}
                {tone === "green" && "Genug neue Aufgaben für weitere Prüfungen."}
            </summary>
            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[26rem] text-xs">
                    <thead>
                        <tr className="text-foreground/50">
                            <th className="p-1 text-start font-medium">Teil</th>
                            <th className="p-1 text-end font-medium">Geeignet</th>
                            <th className="p-1 text-end font-medium">Noch unbenutzt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parts.map((p) => (
                            <tr key={p.partKey} className="border-t border-border/40">
                                <td className="p-1">{p.label}</td>
                                <td className={cn("p-1 text-end tabular-nums", p.eligible < p.required && "font-bold text-red-600")}>{p.eligible}</td>
                                <td className={cn("p-1 text-end tabular-nums", p.minRemainingAcrossUsers < p.required && "font-bold text-amber-700 dark:text-amber-400")}>{p.minRemainingAcrossUsers}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="mt-2 text-xs text-foreground/60">Gründe, warum Aufgaben nicht geeignet sind (z. B. falsche Fragenanzahl, keine Audiodatei), stehen im Tab „Prüfungsprofile“ unter „Verfügbare Aufgaben je Teil“.</p>
            </div>
        </details>
    );
}

function ProfileSets({ profile }: Readonly<{ profile: ExamProfileResponse }>) {
    const queryClient = useQueryClient();
    const [warnings, setWarnings] = useState<Record<string, string[]>>({});
    const [archiveId, setArchiveId] = useState<string | null>(null);
    const key = ["admin-exam-sets", profile.id];
    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: key });
        void queryClient.invalidateQueries({ queryKey: ["admin-exam-profile-availability", profile.id] });
    };
    const sets = useQuery({ queryKey: key, queryFn: () => adminListExamSets(profile.id).then((r) => r.data) });

    const generate = useMutation({
        mutationFn: () => adminGenerateExamSet(profile.id),
        onSuccess: (res) => {
            setWarnings((w) => ({ ...w, [res.data.id]: res.data.warnings }));
            refresh();
        },
        onError: (error) => toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht erstellt werden.")),
    });
    const publish = useMutation({
        mutationFn: (setId: string) => adminPublishExamSet(profile.id, setId),
        onSuccess: (res) => {
            toast.success(`${res.data.title} ist jetzt für Lernende sichtbar.`);
            refresh();
        },
        onError: (error) => toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht veröffentlicht werden.")),
    });
    const discard = useMutation({
        mutationFn: (setId: string) => adminDiscardExamSet(profile.id, setId),
        onSuccess: refresh,
        onError: (error) => toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht entfernt werden.")),
        onSettled: () => setArchiveId(null),
    });
    const reroll = useMutation({
        mutationFn: async (setId: string) => {
            await adminDiscardExamSet(profile.id, setId);
            return adminGenerateExamSet(profile.id);
        },
        onSuccess: (res) => {
            setWarnings((w) => ({ ...w, [res.data.id]: res.data.warnings }));
            refresh();
        },
        onError: (error) => toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht neu erstellt werden.")),
    });

    if (sets.isLoading) return <Loading />;
    const all = sets.data ?? [];
    const drafts = all.filter((s) => s.status === "DRAFT");
    const published = all.filter((s) => s.status === "PUBLISHED");
    const busy = generate.isPending || publish.isPending || discard.isPending || reroll.isPending;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground/70">
                    <span className="font-bold text-foreground">{published.length}</span> veröffentlicht
                    {drafts.length > 0 && <> · <span className="font-bold text-foreground">{drafts.length}</span> Entwurf</>}
                </p>
                <button type="button" className={cn(BTN_PRIMARY, "px-4 py-2")} disabled={busy} onClick={() => generate.mutate()}>
                    <FilePlus2 className="size-4" /> {generate.isPending ? "Wird erstellt …" : "Neue Prüfung erstellen"}
                </button>
            </div>

            <ContentHealth profile={profile} />

            {drafts.map((d) => (
                <DraftCard key={d.id} set={d} warnings={warnings[d.id] ?? []} busy={busy} onPublish={() => publish.mutate(d.id)} onReroll={() => reroll.mutate(d.id)} onDiscard={() => discard.mutate(d.id)} />
            ))}

            {published.length === 0 && drafts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <p className="font-semibold text-foreground">Noch keine Prüfungen für dieses Niveau.</p>
                    <p className="mt-1 text-sm text-foreground/60">Mit „Neue Prüfung erstellen“ wird je Teil eine zufällige Aufgabe gewählt. Du siehst eine Vorschau und veröffentlichst sie dann.</p>
                </div>
            ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                    {published.map((s) => (
                        <PublishedCard key={s.id} set={s} onArchive={() => setArchiveId(s.id)} />
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={archiveId !== null}
                title="Prüfung archivieren?"
                message="Die Prüfung verschwindet für Lernende. Bereits abgeschlossene Ergebnisse bleiben erhalten."
                confirmLabel="Archivieren"
                cancelLabel="Abbrechen"
                onConfirm={() => archiveId && discard.mutate(archiveId)}
                onCancel={() => setArchiveId(null)}
            />
        </div>
    );
}

/** Own tab for pre-generated exams: pick the level, create a random exam, preview it, publish it. */
export default function ExamSetsPanel() {
    const profiles = useQuery({ queryKey: ["admin-exam-profiles"], queryFn: () => adminListExamProfiles().then((r) => r.data) });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    if (profiles.isLoading) return <Loading />;
    const published = (profiles.data ?? []).filter((p) => p.status === "PUBLISHED");
    if (published.length === 0) {
        return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-foreground/70">Es gibt noch kein veröffentlichtes Prüfungsprofil. Veröffentliche zuerst ein Profil im Tab „Prüfungsprofile“.</p>;
    }
    const profile = published.find((p) => p.id === selectedId) ?? published[0];

    return (
        <div className="space-y-5">
            <div role="tablist" aria-label="Niveau" className="flex flex-wrap gap-2">
                {published.map((p) => (
                    <button key={p.id} type="button" role="tab" aria-selected={p.id === profile.id} onClick={() => setSelectedId(p.id)} className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold transition", p.id === profile.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70 hover:bg-accent")}>
                        {p.level} · {p.title}
                    </button>
                ))}
            </div>
            <ProfileSets key={profile.id} profile={profile} />
        </div>
    );
}
