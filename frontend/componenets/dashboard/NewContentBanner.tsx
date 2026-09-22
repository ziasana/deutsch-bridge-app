"use client";

import { Sparkles } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { NewContentDto } from "@/types/dashboard";

interface NewContentBannerProps {
    data: NewContentDto;
}

export default function NewContentBanner({ data }: NewContentBannerProps) {
    const { t } = useI18n();
    const n = t.dashboard.newContent;

    const parts = [
        data.grammarLessons > 0 ? n.grammarLessons(data.grammarLessons) : null,
        data.readingArticles > 0 ? n.readingArticles(data.readingArticles) : null,
        data.expressions > 0 ? n.expressions(data.expressions) : null,
    ].filter(Boolean);

    return (
        <div className="flex items-center gap-3 rounded-[10px] border border-primary/20 bg-primary/5 px-4 py-3">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{n.summary(data.total)}</p>
                {parts.length > 0 && <p className="text-xs text-foreground/60 mt-0.5">{parts.join(" · ")}</p>}
            </div>
        </div>
    );
}
