"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

/** The dashboard's "previous / page x of y / next" row. `page` is zero-based, like the API. */
export default function PublicPager({ page, totalPages, onPage }: Readonly<{ page: number; totalPages: number; onPage: (page: number) => void }>) {
    const { t } = useI18n();
    if (totalPages <= 1) return null;
    const btn = "inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:bg-accent/50 disabled:cursor-default disabled:opacity-40";
    return (
        <div className="flex items-center justify-center gap-3 pt-6">
            <button type="button" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} className={btn}>
                <ChevronLeft className="size-4 rtl:rotate-180" />
                {t.grammar.previous}
            </button>
            <span className="text-sm text-foreground/60">{t.grammar.pageOf(page + 1, totalPages)}</span>
            <button type="button" onClick={() => onPage(Math.min(totalPages - 1, page + 1))} disabled={page + 1 >= totalPages} className={btn}>
                {t.grammar.next}
                <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
        </div>
    );
}
