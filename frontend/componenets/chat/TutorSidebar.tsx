"use client";

import { useState } from "react";
import { Plus, Trash2, MessageCircle } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import type { ChatSessionDto } from "@/types/chat";
import { groupSessionsByDate } from "./chatGroups";

interface TutorSidebarProps {
    sessions: ChatSessionDto[];
    selectedSessionId: string;
    onSelect: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
}

/** Conversation history sidebar: prominent "+ New Chat", sessions grouped into Today/Yesterday/Earlier
 *  (spec s5-s6). Kept deliberately non-dominant - the conversation itself stays the focus. */
export default function TutorSidebar({
    sessions,
    selectedSessionId,
    onSelect,
    onNewChat,
    onDeleteSession,
}: Readonly<TutorSidebarProps>) {
    const { t } = useI18n();
    const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
    const groups = groupSessionsByDate(sessions);

    return (
        <aside className="flex h-full w-full flex-col">
            <div className="p-3">
                <button
                    type="button"
                    onClick={onNewChat}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                    <Plus className="size-4" />
                    {t.chat.newChat}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
                {groups.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center gap-2 px-2 text-center text-sm text-foreground/40">
                        <MessageCircle className="size-6" />
                        <span>{t.chat.chatHistory}</span>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.key} className="mb-4">
                            <h3 className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                                {t.chat.groups[group.key]}
                            </h3>
                            <ul className="space-y-0.5">
                                {group.sessions.map((session) => {
                                    const active = session.id === selectedSessionId;
                                    return (
                                        <li key={session.id} className="group relative">
                                            <button
                                                type="button"
                                                onClick={() => onSelect(session.id)}
                                                className={cn(
                                                    "block w-full truncate rounded-lg px-2.5 py-2 pr-8 text-left text-sm transition",
                                                    active
                                                        ? "bg-accent font-medium text-primary"
                                                        : "text-foreground/75 hover:bg-accent/60",
                                                )}
                                            >
                                                {session.title ?? session.id}
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={t.chat.delete}
                                                onClick={() => setDeleteCandidate(session.id)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground/30 opacity-0 transition hover:bg-accent hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                isOpen={Boolean(deleteCandidate)}
                title={t.chat.delete}
                message={t.chat.confirmDelete}
                confirmLabel={t.chat.delete}
                cancelLabel={t.chat.cancel}
                onConfirm={() => {
                    if (deleteCandidate) onDeleteSession(deleteCandidate);
                    setDeleteCandidate(null);
                }}
                onCancel={() => setDeleteCandidate(null)}
            />
        </aside>
    );
}
