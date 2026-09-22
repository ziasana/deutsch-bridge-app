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
const MessageComposer = forwardRef<HTMLInputElement, MessageComposerProps>(function MessageComposer(
    { value, onChange, onSubmit, disabled }: MessageComposerProps,
    ref,
) {
    const { t } = useI18n();

    return (
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border/60 p-3 sm:p-4">
            <input
                ref={ref}
                name="message"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t.chat.typePlaceholder}
                className="flex-1 rounded-full border border-border/60 bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
                type="submit"
                disabled={disabled || !value.trim()}
                aria-label={t.chat.send}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
                <Send className="size-4" />
            </button>
        </form>
    );
});

export default MessageComposer;
