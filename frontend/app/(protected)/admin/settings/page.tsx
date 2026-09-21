"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import {
    getAuditLog,
    getFeatureLimits,
    getPremiumSetting,
    updateFeatureLimits,
    updatePremiumSetting,
} from "@/services/adminService";
import { AdminAuditLogEntry, FeatureLimit, FeatureLimitUpdatePayload, FeatureType } from "@/types/admin";
import { Card, CardContent } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { ArrowLeft, Sparkles } from "lucide-react";

const FEATURE_LABELS: Record<FeatureType, string> = {
    AI_CHAT: "AI Chat",
    AI_CORRECTION: "AI Correction",
    AI_EXAMPLE: "AI Examples",
    AI_SYNONYM: "AI Synonyms",
};

const FEATURE_ORDER: FeatureType[] = ["AI_CHAT", "AI_CORRECTION", "AI_EXAMPLE", "AI_SYNONYM"];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                checked ? "bg-primary" : "bg-muted border border-border"
            }`}
        >
            <span
                className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [premiumEnabled, setPremiumEnabled] = useState(false);
    const [limits, setLimits] = useState<FeatureLimit[]>([]);
    const [auditLog, setAuditLog] = useState<AdminAuditLogEntry[]>([]);

    const fetchAll = useCallback(() => {
        setIsLoading(true);
        Promise.all([getPremiumSetting(), getFeatureLimits(), getAuditLog()])
            .then(([premiumRes, limitsRes, auditRes]) => {
                setPremiumEnabled(premiumRes.data.enabled);
                setLimits(limitsRes.data);
                setAuditLog(auditRes.data);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load settings."))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchAll();
    }, [hasHydrated, userProfile, router, fetchAll]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const togglePremium = (enabled: boolean) => {
        setIsSaving(true);
        updatePremiumSetting(enabled)
            .then(() => {
                setPremiumEnabled(enabled);
                toast.success(`Premium system ${enabled ? "enabled" : "disabled"}.`);
                fetchAll();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update premium setting."))
            .finally(() => setIsSaving(false));
    };

    const updateLocalLimit = (featureType: FeatureType, accountType: "BASIC" | "PREMIUM", patch: Partial<FeatureLimit>) => {
        setLimits((prev) =>
            prev.map((l) => (l.featureType === featureType && l.accountType === accountType ? { ...l, ...patch } : l))
        );
    };

    const saveLimits = () => {
        const payload: FeatureLimitUpdatePayload[] = limits.map((l) => ({
            featureType: l.featureType,
            accountType: l.accountType,
            dailyLimit: l.dailyLimit,
            enabled: l.enabled,
        }));
        setIsSaving(true);
        updateFeatureLimits(payload)
            .then(() => {
                toast.success("Feature limits saved.");
                fetchAll();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save feature limits."))
            .finally(() => setIsSaving(false));
    };

    const limitFor = (featureType: FeatureType, accountType: "BASIC" | "PREMIUM") =>
        limits.find((l) => l.featureType === featureType && l.accountType === accountType);

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
                            <Sparkles className="size-7 text-primary" /> Monetization &amp; Limits
                        </h1>
                        <p className="text-foreground/60 mt-2">
                            Control the global Premium switch and per-feature daily usage limits.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="mt-10 text-center text-foreground/50">Loading settings...</div>
                ) : (
                    <div className="mt-8 space-y-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Premium System</h2>
                                        <p className="text-sm text-foreground/60 mt-1">
                                            When off, daily AI limits aren&apos;t enforced for anyone &mdash; useful for
                                            testing or before you&apos;re ready to sell Premium. When on, Basic and
                                            Premium users are held to the limits configured below.
                                        </p>
                                    </div>
                                    <Toggle checked={premiumEnabled} onChange={togglePremium} disabled={isSaving} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <h2 className="text-lg font-semibold text-foreground">AI Feature Limits</h2>
                                    <Button variant="primary" onClick={saveLimits} disabled={isSaving}>
                                        Save changes
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Feature</TableHead>
                                            <TableHead>Enabled</TableHead>
                                            <TableHead>Basic / day</TableHead>
                                            <TableHead>Premium / day</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {FEATURE_ORDER.map((featureType) => {
                                            const basic = limitFor(featureType, "BASIC");
                                            const premium = limitFor(featureType, "PREMIUM");
                                            const enabled = basic?.enabled ?? true;
                                            return (
                                                <TableRow key={featureType}>
                                                    <TableCell className="font-medium text-foreground">
                                                        {FEATURE_LABELS[featureType]}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Toggle
                                                            checked={enabled}
                                                            disabled={isSaving}
                                                            onChange={(v) => {
                                                                updateLocalLimit(featureType, "BASIC", { enabled: v });
                                                                updateLocalLimit(featureType, "PREMIUM", { enabled: v });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={basic?.dailyLimit ?? 0}
                                                            onChange={(e) =>
                                                                updateLocalLimit(featureType, "BASIC", {
                                                                    dailyLimit: Number(e.target.value),
                                                                })
                                                            }
                                                            className="w-24 rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={premium?.dailyLimit ?? 0}
                                                            onChange={(e) =>
                                                                updateLocalLimit(featureType, "PREMIUM", {
                                                                    dailyLimit: Number(e.target.value),
                                                                })
                                                            }
                                                            className="w-24 rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold text-foreground mb-4">Admin Activity</h2>
                                <div className="max-h-80 overflow-y-auto space-y-3">
                                    {auditLog.length === 0 && (
                                        <p className="text-sm text-foreground/50">No admin activity recorded yet.</p>
                                    )}
                                    {auditLog.map((entry) => (
                                        <div key={entry.id} className="text-sm border-b border-border pb-2 last:border-0">
                                            <p className="text-foreground/80">
                                                <span className="font-medium">{entry.adminEmail}</span> &mdash; {entry.action}
                                            </p>
                                            <p className="text-foreground/50">{entry.details}</p>
                                            <p className="text-foreground/40 text-xs">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {isSaving && <Loading message="Please wait..." />}
        </div>
    );
}
