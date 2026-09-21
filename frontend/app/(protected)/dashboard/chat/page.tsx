"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Plus, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import {
    chatAi,
    deleteSession,
    getMessagesBySession,
    getSessions,
    updateSessionTitle,
} from "@/services/chatAi";
import type { ChatMessage, ChatRequest, ChatResponse, ChatSessionDto } from "@/types/chat";
import { useI18n } from "@/componenets/I18nProvider";
import Thinking from "@/componenets/Thinking";
import TutorSidebar from "@/componenets/chat/TutorSidebar";
import TutorHeader from "@/componenets/chat/TutorHeader";
import TutorEmptyState from "@/componenets/chat/TutorEmptyState";
import TutorMessage from "@/componenets/chat/TutorMessage";
import UserMessage from "@/componenets/chat/UserMessage";
import MessageComposer from "@/componenets/chat/MessageComposer";

export default function AITutorPage() {
    const { t } = useI18n();
    const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState("");
    const [input, setInput] = useState("");
    const [thinking, setThinking] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const composerRef = useRef<HTMLInputElement | null>(null);
    // Set right before we resolve a brand-new chat's session id ourselves, so the reset-on-switch
    // effect below can tell "the in-progress conversation just got its real id" apart from the
    // user actually picking a different chat in the sidebar - only the latter should clear messages.
    const resolvingOwnSessionRef = useRef(false);

    const loadSessions = () => {
        getSessions()
            .then((data) => setSessions(data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (resolvingOwnSessionRef.current) {
            resolvingOwnSessionRef.current = false;
            return;
        }
        const timer = setTimeout(() => setLocalMessages([]), 0);
        return () => clearTimeout(timer);
    }, [sessionId]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [allMessages, localMessages, thinking]);

    const messages = useMemo(() => [...allMessages, ...localMessages], [allMessages, localMessages]);
    const activeSession = sessions.find((s) => s.id === sessionId) ?? null;
    const showEmptyState = !sessionId && messages.length === 0;

    const handleSelectSession = (id: string) => {
        setSessionId(id);
        setMobileSidebarOpen(false);
        getMessagesBySession(id)
            .then((data) => setAllMessages(data))
            .catch((err) => console.error(err));
    };

    const handleNewChat = () => {
        setSessionId("");
        setAllMessages([]);
        setLocalMessages([]);
        setMobileSidebarOpen(false);
        toast.success(t.chat.newChatToast);
    };

    const handleDeleteSession = (id: string) => {
        deleteSession(id)
            .then((res) => {
                if (res.status === 204) toast.success(t.chat.deleted);
                setSessions((prev) => prev.filter((s) => s.id !== id));
                if (id === sessionId) {
                    setSessionId("");
                    setAllMessages([]);
                    setLocalMessages([]);
                }
            })
            .catch((err) => console.error(err));
    };

    const handleRename = (title: string) => {
        if (!sessionId) return;
        updateSessionTitle(sessionId, title)
            .then((updated) => {
                setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            })
            .catch((err) => console.error(err));
    };

    const handleStarterSelect = (prompt: string) => {
        setInput(prompt);
        composerRef.current?.focus();
    };

    const send = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || thinking) return;

        const now = Date.now().toString();
        const userMsg: ChatMessage = { id: now, role: "user", content: input.trim(), timestamp: now };
        setLocalMessages((prev) => [...prev, userMsg]);
        setInput("");
        setThinking(true);

        const request: ChatRequest = { question: userMsg.content, sessionId };
        chatAi(request)
            .then((data: ChatResponse) => {
                const assistantMsg: ChatMessage = {
                    id: `${Date.now()}-a`,
                    sessionId: data.sessionId,
                    role: "assistant",
                    content: data.content,
                    timestamp: Date.now().toString(),
                };
                setLocalMessages((prev) => [...prev, assistantMsg]);
                setThinking(false);

                if (data.sessionId && data.sessionId !== sessionId) {
                    resolvingOwnSessionRef.current = true;
                    setSessionId(data.sessionId);
                    if (data.sessionTitle) {
                        setSessions((prev) => [
                            { id: data.sessionId, userId: "", title: data.sessionTitle as string, createdAt: new Date().toISOString() },
                            ...prev,
                        ]);
                    } else {
                        loadSessions();
                    }
                }
            })
            .catch((err) => {
                console.error(err);
                setThinking(false);
                if (!err?.isFeatureLimitError) {
                    toast.error(err?.response?.data?.message ?? "Something went wrong.");
                }
            });
    };

    return (
        <div className="flex h-full overflow-hidden bg-background">
            <div className="hidden md:flex md:w-[300px] md:shrink-0 md:border-r md:border-border/60">
                <TutorSidebar
                    sessions={sessions}
                    selectedSessionId={sessionId}
                    onSelect={handleSelectSession}
                    onNewChat={handleNewChat}
                    onDeleteSession={handleDeleteSession}
                />
            </div>

            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        type="button"
                        aria-label={t.chat.cancel}
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-[280px] bg-background shadow-xl">
                        <TutorSidebar
                            sessions={sessions}
                            selectedSessionId={sessionId}
                            onSelect={handleSelectSession}
                            onNewChat={handleNewChat}
                            onDeleteSession={handleDeleteSession}
                        />
                    </div>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 md:hidden">
                    <button
                        type="button"
                        aria-label={t.chat.chatHistory}
                        onClick={() => setMobileSidebarOpen(true)}
                        className="flex size-9 items-center justify-center rounded-full text-foreground/70 hover:bg-accent"
                    >
                        <Menu className="size-5" />
                    </button>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Sparkles className="size-4 text-primary" />
                        {t.chat.yourAiTutor}
                    </span>
                    <button
                        type="button"
                        aria-label={t.chat.newChat}
                        onClick={handleNewChat}
                        className="flex size-9 items-center justify-center rounded-full text-foreground/70 hover:bg-accent"
                    >
                        <Plus className="size-5" />
                    </button>
                </div>

                {showEmptyState ? (
                    <>
                        <div className="flex-1 overflow-y-auto">
                            <TutorEmptyState onStarterSelect={handleStarterSelect} />
                        </div>
                        <div className="mx-auto w-full max-w-3xl">
                            <MessageComposer ref={composerRef} value={input} onChange={setInput} onSubmit={send} disabled={thinking} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <TutorHeader title={activeSession?.title ?? null} onRename={handleRename} onDelete={() => sessionId && handleDeleteSession(sessionId)} />
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                            <div className="mx-auto max-w-3xl space-y-4">
                                {messages.map((m) =>
                                    m.role === "user" ? (
                                        <UserMessage key={m.id} message={m} />
                                    ) : (
                                        <TutorMessage key={m.id} message={m} sessionId={sessionId || null} />
                                    ),
                                )}
                                {thinking && <Thinking />}
                            </div>
                        </div>
                        <div className="mx-auto w-full max-w-3xl">
                            <MessageComposer ref={composerRef} value={input} onChange={setInput} onSubmit={send} disabled={thinking} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
