"use client";

import { Target } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import DashboardTile from "./DashboardTile";
import { CurrentFocusDto } from "@/types/dashboard";

interface CurrentFocusCardProps {
    data: CurrentFocusDto;
}

export default function CurrentFocusCard({ data }: CurrentFocusCardProps) {
    const { t } = useI18n();
    const f = t.dashboard.focus;

    const contentByArea: Record<string, { title: string; description: string }> = {
        VOCABULARY: { title: f.vocabularyTitle, description: f.vocabularyDescription },
        GRAMMAR: { title: f.grammarTitle, description: f.grammarDescription },
        READING: { title: f.readingTitle, description: f.readingDescription },
        EXPRESSIONS: { title: f.expressionsTitle, description: f.expressionsDescription },
        WRITING: {
            title: f.writingTitle,
            description:
                {
                    TASK: f.writingTaskDescription,
                    STRUCTURE: f.writingStructureDescription,
                    VOCABULARY: f.writingVocabularyDescription,
                    FORM: f.writingFormDescription,
                }[data.detail ?? ""] ?? f.writingStructureDescription,
        },
    };

    const content = data.area ? contentByArea[data.area] : null;

    return (
        <DashboardTile
            href={data.route ?? "/dashboard"}
            icon={Target}
            title={f.title}
            cta={f.cta}
            tone={{
                surface: "bg-gradient-to-br from-primary/15 to-primary/5",
                icon: "text-primary",
                iconBg: "bg-primary/15",
            }}
        >
            {content ? (
                <>
                    <p className="text-lg font-semibold text-foreground">{content.title}</p>
                    <p className="mt-1 text-sm text-foreground/65">{content.description}</p>
                </>
            ) : (
                <p className="text-sm text-foreground/65">{f.neutralDescription}</p>
            )}
        </DashboardTile>
    );
}
