"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Timer } from "lucide-react";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import { getExamTimeSettings, resetExamTimeSettings, saveExamTimeSettings } from "@/services/examTimeService";
import { ExamTimeSettings as Settings } from "@/types/examTime";
import {
    checkTotal,
    DraftRow,
    parseMinutes,
    rowError,
    sumTowardsTotal,
} from "@/lib/examTimeSettings";
import { Card, CardContent } from "@/componenets/ui/card";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import SettingsSubNav from "@/componenets/admin/SettingsSubNav";
import ExamDurationSettings from "./ExamDurationSettings";
import ExamTimeConfigurationForm from "./ExamTimeConfigurationForm";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const toRows = (settings: Settings): DraftRow[] =>
    settings.entries.map((entry) => ({
        entry,
        minutes: entry.recommendedMinutes != null ? String(entry.recommendedMinutes) : "",
        enabled: entry.enabled,
    }));

const SELECT_CLASS =
    "rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none";

export default function ExamTimeSettings() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [level, setLevel] = useState("B1");
    const [settings, setSettings] = useState<Settings | null>(null);
    const [rows, setRows] = useState<DraftRow[]>([]);
    const [total, setTotal] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const apply = useCallback((next: Settings) => {
        setSettings(next);
        setRows(toRows(next));
        setTotal(next.totalDurationMinutes != null ? String(next.totalDurationMinutes) : "");
    }, []);

    const load = useCallback(
        (forLevel: string) => {
            getExamTimeSettings(forLevel)
                .then((res) => apply(res.data))
                .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load time settings."))
                .finally(() => setIsLoading(false));
        },
        [apply],
    );

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        load(level);
    }, [hasHydrated, userProfile, router, load, level]);

    const min = settings?.minMinutes ?? 1;
    const max = settings?.maxMinutes ?? 180;
    const maxTotal = settings?.maxTotalMinutes ?? 300;

    const derived = useMemo(() => {
        const parsedTotal = parseMinutes(total, 1, maxTotal);
        const configured = sumTowardsTotal(rows, min, max);
        return {
            parsedTotal,
            configured,
            check: checkTotal(configured, parsedTotal.kind === "ok" ? parsedTotal.value : null),
            hasRowError: rows.some((r) => rowError(r, min, max) != null),
        };
    }, [rows, total, min, max, maxTotal]);

    const canSave = !derived.hasRowError && derived.parsedTotal.kind !== "invalid" && derived.check.kind !== "over";

    const save = () => {
        const configurations = rows.flatMap((row) => {
            const parsed = parseMinutes(row.minutes, min, max);
            // Parts the admin never filled in are not created.
            return parsed.kind === "ok"
                ? [{ section: row.entry.section, teil: row.entry.teil, recommendedMinutes: parsed.value, enabled: row.enabled }]
                : [];
        });
        setIsSaving(true);
        saveExamTimeSettings({
            level,
            totalDurationMinutes: derived.parsedTotal.kind === "ok" ? derived.parsedTotal.value : null,
            configurations,
        })
            .then((res) => {
                apply(res.data);
                toast.success("Time settings saved.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save time settings."))
            .finally(() => setIsSaving(false));
    };

    const reset = () => {
        setConfirmReset(false);
        setIsSaving(true);
        resetExamTimeSettings(level)
            .then((res) => {
                apply(res.data);
                toast.success("Reset to defaults.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to reset time settings."))
            .finally(() => setIsSaving(false));
    };

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    return (
        <div className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <button
                            type="button"
                            onClick={() => router.push("/admin")}
                            className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-2"
                        >
                            <ArrowLeft className="size-4" /> Back to Admin
                        </button>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <Timer className="size-7 text-primary" /> Exam Time Management
                        </h1>
                        <p className="text-foreground/60 mt-2">
                            Configure recommended practice times for each exam level and part. These are training targets
                            for learners, not official per-Teil time limits of the exam.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <SettingsSubNav />
                </div>

                {isLoading || !settings ? (
                    <div className="mt-10 text-center text-foreground/50">Loading time settings...</div>
                ) : (
                    <div className="mt-8 space-y-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <h2 className="text-lg font-semibold text-foreground">Recommended Times</h2>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <select
                                            aria-label="Exam"
                                            className={SELECT_CLASS}
                                            disabled
                                            value="TELC"
                                            onChange={() => undefined}
                                        >
                                            <option value="TELC">telc Deutsch</option>
                                        </select>
                                        <select
                                            aria-label="Level"
                                            value={level}
                                            onChange={(e) => {
                                                setIsLoading(true);
                                                setLevel(e.target.value);
                                            }}
                                            className={SELECT_CLASS}
                                            disabled={isSaving}
                                        >
                                            {LEVELS.map((lvl) => (
                                                <option key={lvl} value={lvl}>
                                                    {lvl}
                                                </option>
                                            ))}
                                        </select>
                                        <Button variant="secondary" onClick={() => setConfirmReset(true)} disabled={isSaving}>
                                            Reset to defaults
                                        </Button>
                                        <Button variant="primary" onClick={save} disabled={isSaving || !canSave}>
                                            Save changes
                                        </Button>
                                    </div>
                                </div>
                                <ExamTimeConfigurationForm
                                    rows={rows}
                                    min={min}
                                    max={max}
                                    disabled={isSaving}
                                    onChange={(index, patch) =>
                                        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
                                    }
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold text-foreground mb-4">Exam Duration</h2>
                                <ExamDurationSettings
                                    total={total}
                                    onTotalChange={setTotal}
                                    totalError={derived.parsedTotal.kind === "invalid"}
                                    configuredMinutes={derived.configured}
                                    check={derived.check}
                                    maxTotalMinutes={maxTotal}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmReset}
                title="Reset to defaults?"
                message={`This replaces all ${level} time settings with the built-in training defaults. Levels without defaults are cleared.`}
                confirmLabel="Reset"
                cancelLabel="Cancel"
                onConfirm={reset}
                onCancel={() => setConfirmReset(false)}
            />

            {isSaving && <Loading message="Please wait..." />}
        </div>
    );
}
