"use client";

import { ArrowRight, Bookmark, BookmarkCheck } from "lucide-react";
import { Badge } from "@/componenets/ui/badge";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { ExpressionListItem, ExpressionType } from "@/types/expression";
import { cn } from "@/lib/utils";
import { getExpressionImageSrc } from "@/lib/expressionImages";
import { getIllustrationFor } from "@/componenets/expressions/illustrations";

const TYPE_LABEL: Record<ExpressionType, string> = {
    NOMEN_VERB_VERBINDUNG: "Nomen-Verb-Verbindung",
    REDEWENDUNG: "Redewendung",
};

const UNDERSTAND_COLOR = "#22c55e";
const USE_COLOR = "#3b82f6";

interface ExpressionCardProps {
    expression: ExpressionListItem;
    collectionType: ExpressionType;
    practiceVariant?: "primary" | "outline";
    onOpen: (expression: ExpressionListItem) => void;
    onPractice: (expression: ExpressionListItem) => void;
    onToggleBookmark: (expression: ExpressionListItem) => void;
    className?: string;
}

export default function ExpressionCard({
    expression,
    collectionType,
    practiceVariant = "outline",
    onOpen,
    onPractice,
    onToggleBookmark,
    className,
}: ExpressionCardProps) {
    const understand = Math.round(expression.overallScore ?? 0);
    const use = Math.round(expression.productionScore ?? 0);
    const example = expression.exampleSentence;

    const uploadedImageSrc = collectionType === "REDEWENDUNG" ? getExpressionImageSrc(expression.imageUrl) : null;
    const illustration = collectionType === "REDEWENDUNG" && !uploadedImageSrc ? getIllustrationFor(expression.expression) : null;
    // Invoked as a plain function (not a JSX tag) since it's a stable reference picked from a
    // static lookup map, not a component being defined during this render.
    const illustrationNode = illustration ? illustration({ className: "h-full w-full rounded-t-2xl object-cover" }) : null;
    const hasVisual = Boolean(uploadedImageSrc || illustrationNode);

    const badges = (
        <>
            <Badge
                variant="secondary"
                className={cn(hasVisual && "bg-white/90 text-foreground shadow-sm backdrop-blur-sm")}
            >
                {expression.level}
            </Badge>
            <Badge
                variant="outline"
                className={cn(hasVisual && "border-transparent bg-white/90 text-foreground shadow-sm backdrop-blur-sm")}
            >
                {TYPE_LABEL[collectionType]}
            </Badge>
        </>
    );

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(expression)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen(expression);
            }}
            className={cn(
                "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card text-left shadow-card transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40 overflow-hidden",
                hasVisual ? "pb-5" : "p-5",
                className,
            )}
        >
            {hasVisual ? (
                <div className="relative aspect-[2.3/1] w-full shrink-0 overflow-hidden rounded-t-2xl">
                    {uploadedImageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={uploadedImageSrc} alt="" className="h-full w-full rounded-t-2xl object-cover" />
                    ) : (
                        illustrationNode
                    )}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">{badges}</div>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-2">{badges}</div>
            )}

            <div className={cn(hasVisual && "px-5")}>
                <h3 className="text-lg font-semibold text-foreground">{expression.expression}</h3>
                <p className="mt-1 text-sm text-foreground/60">{expression.meaningDe}</p>
            </div>

            {example && (
                <div className={cn("rounded-lg bg-accent/50 px-3 py-2.5 text-sm text-foreground/75 italic", hasVisual && "mx-5")}>
                    „{example}“
                </div>
            )}

            <div className={cn("mt-auto space-y-2 pt-1", hasVisual && "px-5")}>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/55">Verstehen</span>
                        <span className="font-medium text-foreground/70">{understand}%</span>
                    </div>
                    <LearningProgressBar value={understand} color={UNDERSTAND_COLOR} ariaLabel="Verstehen progress" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/55">Verwenden</span>
                        <span className="font-medium text-foreground/70">{use}%</span>
                    </div>
                    <LearningProgressBar value={use} color={USE_COLOR} ariaLabel="Verwenden progress" />
                </div>
            </div>

            <div className={cn("mt-1 flex items-center gap-2", hasVisual && "px-5")}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPractice(expression);
                    }}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
                        practiceVariant === "primary"
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-primary/10 text-primary hover:bg-primary/20",
                    )}
                >
                    Practice
                    <ArrowRight className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(expression);
                    }}
                    aria-label={expression.bookmarked ? "Remove bookmark" : "Bookmark this expression"}
                    aria-pressed={expression.bookmarked}
                    className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border transition",
                        expression.bookmarked
                            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                            : "border-border/60 bg-card text-foreground/50 hover:bg-accent hover:text-foreground",
                    )}
                >
                    {expression.bookmarked ? (
                        <BookmarkCheck className="size-4" />
                    ) : (
                        <Bookmark className="size-4" />
                    )}
                </button>
            </div>
        </div>
    );
}
