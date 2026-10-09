"use client";

import { useState } from "react";
import { Plus, Trash2, MessageCircle, Sparkles } from "lucide-react";
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
        <aside className="flex h-full w-full flex-col bg-card">
            <div className="space-y-3 p-3 pb-2">
                <div className="flex items-center gap-2.5 px-1 pt-1">
                    <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] text-white shadow-sm">
                        <Sparkles className="size-4" />
                    </span>
                    <span className="font-bold text-foreground">{t.chat.yourAiTutor}</span>
                </div>
                <button
                    type="button"
                    onClick={onNewChat}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
                                                    "block w-full truncate rounded-xl border-l-[3px] px-3 py-2.5 pr-8 text-left text-sm transition",
                                                    active
                                                        ? "border-primary bg-accent font-medium text-primary"
                                                        : "border-transparent text-foreground/75 hover:bg-accent/60",
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
