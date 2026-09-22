"use client";

import { Bookmark, BookmarkCheck, Volume2, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/componenets/ui/badge";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { VocabularyItem } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
import { useI18n } from "@/componenets/I18nProvider";

const RECALL_COLOR = "#22c55e";
const CONTEXT_COLOR = "#3b82f6";

interface VocabularyCardProps {
    item: VocabularyItem;
    onOpen: (item: VocabularyItem) => void;
    onPractice: (item: VocabularyItem) => void;
    onToggleBookmark: (item: VocabularyItem) => void;
    onEdit?: (item: VocabularyItem) => void;
    onDelete?: (item: VocabularyItem) => void;
    className?: string;
}

export default function VocabularyCard({
    item,
    onOpen,
    onPractice,
    onToggleBookmark,
    onEdit,
    onDelete,
    className,
}: VocabularyCardProps) {
    const { t } = useI18n();
    const recall = Math.round(item.progress?.recallScore ?? 0);
    const context = Math.round(item.progress?.contextScore ?? 0);
    const wordLabel = item.article ? `${item.article} ${item.word}` : item.word;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(item)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen(item);
            }}
            className={cn(
                "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 text-left shadow-card transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-border",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {item.level && <Badge variant="secondary">{item.level}</Badge>}
                    <Badge variant="outline">
                        {item.source === "DICTIONARY"
                            ? t.vocabulary.sourceTabs.fromReading
                            : item.source === "AI_TUTOR"
                              ? t.vocabulary.sourceTabs.fromAiTutor
                              : t.vocabulary.sourceTabs.myWords}
                    </Badge>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        playVocabularyAudio(item.audioUrl, item.word);
                    }}
                    aria-label={t.vocabulary.card.playAudioAria}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition hover:bg-accent/70"
                >
                    <Volume2 className="size-4" />
                </button>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-foreground">{wordLabel}</h3>
                <p className="mt-1 text-sm text-foreground/60">{item.meaning}</p>
            </div>

            {item.example && (
                <div className="rounded-lg bg-accent/50 px-3 py-2.5 text-sm text-foreground/75 italic">„{item.example}“</div>
            )}

            <div className="mt-auto space-y-2 pt-1">
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/55">{t.vocabulary.card.recall}</span>
                        <span className="font-medium text-foreground/70">{recall}%</span>
                    </div>
                    <LearningProgressBar value={recall} color={RECALL_COLOR} ariaLabel={t.vocabulary.card.recall} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/55">{t.vocabulary.card.context}</span>
                        <span className="font-medium text-foreground/70">{context}%</span>
                    </div>
                    <LearningProgressBar value={context} color={CONTEXT_COLOR} ariaLabel={t.vocabulary.card.context} />
                </div>
            </div>

            <div className="mt-1 flex items-center gap-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPractice(item);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
                >
                    {t.vocabulary.card.practice}
                    <ArrowRight className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item);
                    }}
                    aria-label={item.bookmarked ? t.vocabulary.card.bookmarkRemove : t.vocabulary.card.bookmarkAdd}
                    aria-pressed={item.bookmarked}
                    className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border transition",
                        item.bookmarked
                            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                            : "border-border/60 bg-card text-foreground/50 hover:bg-accent hover:text-foreground",
                    )}
                >
                    {item.bookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                </button>
                {item.source !== "DICTIONARY" && onEdit && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        aria-label={t.vocabulary.card.editAria}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground/50 transition hover:bg-accent hover:text-foreground"
                    >
                        <Pencil className="size-4" />
                    </button>
                )}
                {item.source !== "DICTIONARY" && onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                        }}
                        aria-label={t.vocabulary.card.deleteAria}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground/50 transition hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="size-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
