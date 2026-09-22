"use client";

import { useI18n } from "@/componenets/I18nProvider";

export default function Thinking() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="typing-indicator flex gap-1">
        <span className="dot bg-gray-400 w-2 h-2 rounded-full animate-bounce"></span>
        <span className="dot bg-gray-400 w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s]"></span>
        <span className="dot bg-gray-400 w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s]"></span>
      </div>
      <span className="text-sm text-gray-500">{t.chat.thinking}</span>
    </div>
  );
}
