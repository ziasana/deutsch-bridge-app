"use client";

import { MessageCircle, PenLine, BookOpen, HelpCircle, ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

interface TutorEmptyStateProps {
    onStarterSelect: (prompt: string) => void;
}

/** Welcome state shown when there's no active conversation. The starter cards are just
 *  conversation openers (they prefill the composer) - not separate AI modes, per spec s4. */
export default function TutorEmptyState({ onStarterSelect }: Readonly<TutorEmptyStateProps>) {
    const { t } = useI18n();
    const starters = [
        { ...t.chat.emptyState.starters.speaking, icon: MessageCircle, tone: "from-learning-expression/15 to-learning-expression/5", text: "text-learning-expression", bg: "bg-learning-expression/15" },
        { ...t.chat.emptyState.starters.writing, icon: PenLine, tone: "from-learning-vocabulary/15 to-learning-vocabulary/5", text: "text-learning-vocabulary", bg: "bg-learning-vocabulary/15" },
        { ...t.chat.emptyState.starters.grammar, icon: BookOpen, tone: "from-learning-grammar/15 to-learning-grammar/5", text: "text-learning-grammar", bg: "bg-learning-grammar/15" },
        { ...t.chat.emptyState.starters.question, icon: HelpCircle, tone: "from-learning-review/15 to-learning-review/5", text: "text-learning-review", bg: "bg-learning-review/15" },
    ];

    return (
        <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
            <div className="relative">
                <span aria-hidden="true" className="absolute inset-0 rounded-full bg-primary/25 motion-safe:animate-ping [animation-duration:2.5s]" />
                <span className="relative flex size-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] text-white shadow-card">
                    <Sparkles className="size-9" aria-hidden="true" />
                </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-foreground">{t.chat.emptyState.greeting}</h2>
            <p className="mt-2 max-w-md text-foreground/65">{t.chat.emptyState.intro}</p>

            <div className="mt-8 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
                {starters.map((s) => (
                    <button
                        key={s.title}
                        type="button"
                        onClick={() => onStarterSelect(s.prompt)}
                        className={`group flex cursor-pointer flex-col items-start gap-3 rounded-2xl bg-gradient-to-br ${s.tone} p-5 transition duration-200 hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                    >
                        <span className={`flex size-10 items-center justify-center rounded-xl ${s.bg}`}>
                            <s.icon className={`size-5 ${s.text}`} aria-hidden="true" />
                        </span>
                        <span>
                            <span className="block font-semibold text-foreground">{s.title}</span>
                            <span className="mt-0.5 block text-sm text-foreground/60">{s.description}</span>
                        </span>
                        <ArrowRight className={`size-4 ${s.text} transition-transform group-hover:translate-x-1`} aria-hidden="true" />
                    </button>
                ))}
            </div>

            <p className="mt-8 text-sm text-foreground/45">{t.chat.emptyState.orWriteFirst}</p>
        </div>
    );
}
