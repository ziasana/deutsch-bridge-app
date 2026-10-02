"use client";

import { useI18n } from "@/componenets/I18nProvider";
import TutorAvatar from "@/componenets/chat/TutorAvatar";

/** The tutor is typing: its avatar plus three softly bouncing brand-colored dots. */
export default function Thinking() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3" role="status" aria-label={t.chat.thinking}>
      <TutorAvatar />
      <div className="flex items-center gap-2 rounded-3xl rounded-tl-md bg-card px-4 py-3 shadow-card">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-primary/70 motion-safe:animate-bounce" />
          <span className="size-2 rounded-full bg-primary/70 motion-safe:animate-bounce [animation-delay:0.15s]" />
          <span className="size-2 rounded-full bg-primary/70 motion-safe:animate-bounce [animation-delay:0.3s]" />
        </span>
        <span className="text-sm text-foreground/55">{t.chat.thinking}</span>
      </div>
    </div>
  );
}
