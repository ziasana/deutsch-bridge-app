"use client";

import Link from "next/link";
import { ArrowRight, BookmarkCheck } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { usePendingGrammarBookmarks } from "@/hook/usePendingGrammarBookmarks";

/** Dashboard reminder: pending bookmarked grammar lessons. Renders nothing when there are none. */
export default function SavedLessonsChip() {
    const { t } = useI18n();
    const { data: lessons = [] } = usePendingGrammarBookmarks();

    if (lessons.length === 0) return null;

    return (
        <Link
            href="/dashboard/grammar"
            className="group flex items-center gap-3 rounded-full bg-primary/8 px-5 py-2.5 transition hover:bg-primary/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
            <BookmarkCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{t.grammar.savedChip(lessons.length)}</p>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                {t.grammar.savedChipCta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
        </Link>
    );
}
