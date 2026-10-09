"use client";

import { forwardRef } from "react";
import { Send } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

interface MessageComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    disabled?: boolean;
}

/** Clean single-row composer matching the rest of DeutschBridge - same send/disabled behavior as
 *  before, just restyled (spec s18). */
const MessageComposer = forwardRef<HTMLTextAreaElement, MessageComposerProps>(function MessageComposer(
    { value, onChange, onSubmit, disabled }: MessageComposerProps,
    ref,
) {
    const { t } = useI18n();

    return (
        <form onSubmit={onSubmit} className="px-3 pb-4 pt-2 sm:px-4 sm:pb-5">
          <div className="flex items-end gap-2 rounded-3xl bg-card p-1.5 pl-5 shadow-card ring-1 ring-border/60 transition focus-within:ring-2 focus-within:ring-primary/40">
            <textarea
                ref={ref}
                name="message"
                rows={1}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                // Enter sends, Shift+Enter starts a new line.
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                placeholder={t.chat.typePlaceholder}
                autoComplete="off"
                className="field-sizing-content max-h-40 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-sm leading-6 text-foreground outline-none placeholder:text-foreground/40"
            />
            <button
                type="submit"
                disabled={disabled || !value.trim()}
                aria-label={t.chat.send}
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:scale-105 hover:bg-primary/90 disabled:cursor-default disabled:opacity-40 disabled:hover:scale-100"
            >
                <Send className="size-4" />
            </button>
          </div>
        </form>
    );
});

export default MessageComposer;
