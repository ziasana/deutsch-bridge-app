"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import { Button } from "@/componenets/ui/button";
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
    };

    const content = data.area ? contentByArea[data.area] : null;

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12">
                    <Target className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{f.title}</h2>
            </div>

            <div className="mt-3 flex-1">
                {content ? (
                    <>
                        <p className="font-medium text-foreground">{content.title}</p>
                        <p className="text-sm text-foreground/60 mt-1">{content.description}</p>
                    </>
                ) : (
                    <p className="text-sm text-foreground/60">{f.neutralDescription}</p>
                )}
            </div>

            {data.route && (
                <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={data.route}>{f.cta}</Link>
                </Button>
            )}
        </Card>
    );
}
