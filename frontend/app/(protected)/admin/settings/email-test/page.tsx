"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Mail, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import { getAllUsers, getEmailTestConfig, getEmailTestLogs, sendTestEmail } from "@/services/adminService";
import { AdminUser, EmailConfig, EmailSendLogEntry, EmailTestType } from "@/types/admin";
import { Card, CardContent } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";

const TYPE_LABELS: Record<EmailTestType, string> = {
    TEST: "Simple test email",
    VERIFICATION: "Verification email (template, dead link)",
    PASSWORD_RESET: "Password reset email (template, dead link)",
};

const CATEGORY_LABELS: Record<string, string> = {
    INVALID_RECIPIENT: "Recipient rejected",
    AUTHENTICATION_FAILED: "SMTP login failed",
    CONNECTION_FAILED: "Cannot reach SMTP server",
    TIMEOUT: "Timed out",
    TLS_ERROR: "TLS/SSL error",
    SENDER_REJECTED: "Sender rejected",
    UNKNOWN: "Unknown error",
};

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export default function AdminEmailTestPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [config, setConfig] = useState<EmailConfig | null>(null);
    const [logs, setLogs] = useState<EmailSendLogEntry[]>([]);
    const [recipient, setRecipient] = useState("");
    const [type, setType] = useState<EmailTestType>("TEST");
    const [result, setResult] = useState<EmailSendLogEntry | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const refreshLogs = useCallback(() => {
        getEmailTestLogs()
            .then((res) => setLogs(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load email log."));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        Promise.all([getAllUsers(), getEmailTestConfig(), getEmailTestLogs()])
            .then(([usersRes, configRes, logsRes]) => {
                setUsers(usersRes.data);
                setConfig(configRes.data);
                setLogs(logsRes.data);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load email testing data."))
            .finally(() => setIsLoading(false));
    }, [hasHydrated, userProfile, router]);

    const suggestions = useMemo(() => {
        const q = recipient.trim().toLowerCase();
        if (q.length < 2) return [];
        return users
            .filter((u) => u.email.toLowerCase().includes(q) || (u.displayName ?? "").toLowerCase().includes(q))
            .slice(0, 6);
    }, [users, recipient]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return <Loading />;

    const canSend = /^\S+@\S+\.\S+$/.test(recipient.trim()) && !isSending;
    const isExactUser = users.some((u) => u.email.toLowerCase() === recipient.trim().toLowerCase());

    const send = () => {
        setIsSending(true);
        setResult(null);
        sendTestEmail(recipient.trim(), type)
            .then((res) => {
                setResult(res.data);
                refreshLogs();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Request failed before the email could be attempted."))
            .finally(() => setIsSending(false));
    };

    return (
        <div className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
                <button
                    type="button"
                    onClick={() => router.push("/admin")}
                    className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-2"
                >
                    <ArrowLeft className="size-4" /> Back to Admin
                </button>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Mail className="size-7 text-primary" /> Email Testing
                </h1>
                <p className="text-foreground/60 mt-2">
                    Send a test email to a user or any address and see exactly whether delivery worked.
                </p>

                <div className="mt-6" />

                {isLoading ? (
                    <Loading />
                ) : (
                    <div className="space-y-6">
                        {config && (
                            <p className="text-sm text-foreground/60">
                                SMTP <span className="font-mono">{config.host ?? "?"}:{config.port ?? "?"}</span> · login{" "}
                                <span className="font-mono">{config.username ?? "?"}</span> · from{" "}
                                <span className="font-mono">
                                    {config.fromName} &lt;{config.fromAddress}&gt;
                                </span>
                            </p>
                        )}

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1" htmlFor="recipient">
                                        Recipient (search a user or type any address)
                                    </label>
                                    <input
                                        id="recipient"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        placeholder="user@example.com"
                                        autoComplete="off"
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
                                    />
                                    {suggestions.length > 0 && !isExactUser && (
                                        <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-background shadow-md">
                                            {suggestions.map((u) => (
                                                <li key={u.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRecipient(u.email)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        {u.displayName ? `${u.displayName} · ` : ""}
                                                        {u.email}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {recipient.trim() && (
                                        <p className="text-xs text-foreground/50 mt-1">
                                            {isExactUser ? "Registered user" : "Not a registered user (external address)"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1" htmlFor="email-type">
                                        Email type
                                    </label>
                                    <select
                                        id="email-type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value as EmailTestType)}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
                                    >
                                        {(Object.keys(TYPE_LABELS) as EmailTestType[]).map((t) => (
                                            <option key={t} value={t}>
                                                {TYPE_LABELS[t]}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-foreground/50 mt-1">
                                        Template tests use a placeholder token: nothing is changed on the user&apos;s account.
                                    </p>
                                </div>

                                <Button onClick={send} disabled={!canSend}>
                                    {isSending ? "Sending…" : "Send email"}
                                </Button>

                                {result && <ResultBanner entry={result} />}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold mb-4">Send history</h2>
                                {logs.length === 0 ? (
                                    <p className="text-sm text-foreground/60">No test emails sent yet.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>When</TableHead>
                                                <TableHead>Recipient</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Result</TableHead>
                                                <TableHead>Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.map((l) => (
                                                <LogRow
                                                    key={l.id}
                                                    entry={l}
                                                    expanded={expandedId === l.id}
                                                    onToggle={() => setExpandedId(expandedId === l.id ? null : l.id)}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResultBanner({ entry }: { entry: EmailSendLogEntry }) {
    const ok = entry.status === "SUCCESS";
    return (
        <div
            role="status"
            className={`rounded-md border p-4 text-sm ${
                ok
                    ? "border-green-300 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 dark:border-green-800"
                    : "border-red-300 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 dark:border-red-800"
            }`}
        >
            <p className="font-medium flex items-center gap-2">
                {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                {ok
                    ? `Accepted by the SMTP server for ${entry.recipientEmail} (${entry.durationMs} ms).`
                    : `Failed: ${CATEGORY_LABELS[entry.errorCategory ?? "UNKNOWN"]}`}
            </p>
            {ok ? (
                <p className="mt-1 opacity-80">
                    The server accepted the message; check the inbox (and spam) to confirm it arrived.
                </p>
            ) : (
                <>
                    <p className="mt-1">{entry.errorMessage}</p>
                    {entry.errorDetail && (
                        <pre className="mt-2 whitespace-pre-wrap break-words text-xs opacity-80">{entry.errorDetail}</pre>
                    )}
                </>
            )}
        </div>
    );
}

function LogRow({ entry, expanded, onToggle }: { entry: EmailSendLogEntry; expanded: boolean; onToggle: () => void }) {
    const ok = entry.status === "SUCCESS";
    return (
        <>
            <TableRow className={ok ? "" : "cursor-pointer"} onClick={ok ? undefined : onToggle}>
                <TableCell className="whitespace-nowrap">{formatDate(entry.createdAt)}</TableCell>
                <TableCell>{entry.recipientEmail}</TableCell>
                <TableCell>{entry.emailType}</TableCell>
                <TableCell>
                    <span className={ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {ok ? "Success" : CATEGORY_LABELS[entry.errorCategory ?? "UNKNOWN"]}
                    </span>
                </TableCell>
                <TableCell>{entry.durationMs} ms</TableCell>
            </TableRow>
            {expanded && !ok && (
                <TableRow>
                    <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900 text-xs">
                        <p>{entry.errorMessage}</p>
                        <pre className="mt-2 whitespace-pre-wrap break-words opacity-80">{entry.errorDetail}</pre>
                        <p className="mt-2 opacity-60">
                            {entry.smtpHost}:{entry.smtpPort} · from {entry.fromAddress} · by {entry.sentByAdminEmail}
                        </p>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}
