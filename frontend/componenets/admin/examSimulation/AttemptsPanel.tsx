"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Loading from "@/componenets/Loading";
import SimResultBadge from "@/componenets/exam/simulation/SimResultBadge";
import { formatDateTime } from "@/lib/examSimulation";
import { adminListExamAttempts } from "@/services/adminExamSimulationService";
import type { AttemptStatus } from "@/types/examSimulation";
import { INPUT } from "./fields";

const STATUS_LABEL: Record<string, string> = { IN_PROGRESS: "Läuft", COMPLETED: "Abgeschlossen", EXPIRED: "Zeit abgelaufen", CANCELLED: "Abgebrochen" };

export default function AttemptsPanel() {
    const [status, setStatus] = useState<AttemptStatus | "">("");
    const { data, isLoading } = useQuery({ queryKey: ["admin-exam-attempts", status], queryFn: () => adminListExamAttempts(status || undefined).then((r) => r.data) });
    return (
        <div className="space-y-4">
            <select aria-label="Status filtern" className={`${INPUT} max-w-xs`} value={status} onChange={(e) => setStatus(e.target.value as AttemptStatus | "")}>
                <option value="">Alle Status</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                ))}
            </select>
            {isLoading ? <Loading /> : (
                <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
                    <table className="w-full min-w-[44rem] text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-wide text-foreground/50">
                                <th className="p-3 text-start font-medium">Start</th>
                                <th className="p-3 text-start font-medium">Lernende/r</th>
                                <th className="p-3 text-start font-medium">Profil</th>
                                <th className="p-3 text-start font-medium">Status</th>
                                <th className="p-3 text-start font-medium">Gesamtergebnis</th>
                                <th className="p-3 text-start font-medium">Bewertung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data ?? []).map((a) => (
                                <tr key={a.id} className="border-t border-border/50">
                                    <td className="p-3">{formatDateTime(a.startedAtMs)}</td>
                                    <td className="p-3 font-mono text-xs">{a.userId}</td>
                                    <td className="p-3">{a.profileCode} v{a.profileVersion}</td>
                                    <td className="p-3">{STATUS_LABEL[a.status]}</td>
                                    <td className="p-3"><SimResultBadge status={a.overallResult} /></td>
                                    <td className="p-3">{a.awaitingAssessment ? "offen" : "–"}</td>
                                </tr>
                            ))}
                            {(data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-foreground/60">Keine Versuche.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
