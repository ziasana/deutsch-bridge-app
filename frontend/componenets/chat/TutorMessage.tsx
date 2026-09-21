"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import { checkVocabularyExists, classifySelection, createVocabularyFromChat } from "@/services/vocabularyService";
import type { ChatMessage } from "@/types/chat";
import { useI18n } from "@/componenets/I18nProvider";
import { useTextSelection } from "./useTextSelection";
import SelectionActionButton from "./SelectionActionButton";

interface TutorMessageProps {
    message: ChatMessage;
    sessionId: string | null;
}

/** Assistant message bubble with a subtle "Tutor" identity (not a plain gray ChatGPT-style bubble)
 *  and text-selection support: selecting a word/phrase inside the message shows a floating
 *  "Save word"/"Save expression" action that classifies+normalizes and saves straight to
 *  Vocabulary with no extra confirmation step - just a toast for the result. User messages don't
 *  get this - see UserMessage. */
export default function TutorMessage({ message, sessionId }: Readonly<TutorMessageProps>) {
    const { t } = useI18n();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selection = useTextSelection(containerRef);
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        if (!selection || saving) return;
        const selectedText = selection.text;
        setSaving(true);

        classifySelection(selectedText, message.content)
            .then(async ({ data: classified }) => {
                const existing = await checkVocabularyExists(classified.normalizedText);
                if (existing.data.exists) {
                    toast.info(t.chat.selection.alreadySaved);
                    return;
                }

                await createVocabularyFromChat({
                    word: classified.normalizedText,
                    meaning: classified.meaning,
                    example: classified.example || null,
                    sourceChatId: sessionId,
                    sourceMessageId: message.id,
                    level: null,
                });
                toast.success(t.chat.selection.savedToVocabulary);
            })
            .catch((err) => {
                console.error(err);
                toast.error(err?.response?.data?.message ?? t.chat.selection.saveFailed);
            })
            .finally(() => {
                setSaving(false);
                window.getSelection()?.removeAllRanges();
            });
    };

    return (
        <div className="max-w-[85%]">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                AI Tutor
            </div>
            <div
                ref={containerRef}
                className="select-text space-y-2 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-card [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-accent [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs"
            >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>

            {selection && <SelectionActionButton selection={selection} saving={saving} onSave={handleSave} />}
        </div>
    );
}
