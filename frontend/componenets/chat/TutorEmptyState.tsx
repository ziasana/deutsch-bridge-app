"use client";

import { Sparkles, MessageCircle, PenLine, BookOpen, HelpCircle } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

interface TutorEmptyStateProps {
    onStarterSelect: (prompt: string) => void;
}

/** Welcome state shown when there's no active conversation. The starter cards are just
 *  conversation openers (they prefill the composer) - not separate AI modes, per spec s4. */
export default function TutorEmptyState({ onStarterSelect }: Readonly<TutorEmptyStateProps>) {
    const { t } = useI18n();
    const starters = [
        { ...t.chat.emptyState.starters.speaking, icon: MessageCircle },
        { ...t.chat.emptyState.starters.writing, icon: PenLine },
        { ...t.chat.emptyState.starters.grammar, icon: BookOpen },
        { ...t.chat.emptyState.starters.question, icon: HelpCircle },
    ];

    return (
        <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent">
                <Sparkles className="size-6 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">{t.chat.emptyState.greeting}</h2>
            <p className="mt-2 max-w-md text-sm text-foreground/60">{t.chat.emptyState.intro}</p>

            <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                {starters.map((s) => (
                    <button
                        key={s.title}
                        type="button"
                        onClick={() => onStarterSelect(s.prompt)}
                        className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <div className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
                            <s.icon className="size-5" />
                        </div>
                        <p className="font-semibold text-foreground">{s.title}</p>
                        <p className="text-sm text-foreground/55">{s.description}</p>
                    </button>
                ))}
            </div>

            <p className="mt-6 text-sm text-foreground/40">{t.chat.emptyState.orWriteFirst}</p>
        </div>
    );
}
