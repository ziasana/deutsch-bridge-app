"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Pencil, Plus, Sparkles, X } from "lucide-react";
import { createVocabulary, updateVocabulary } from "@/services/vocabularyService";
import { generateAiExample } from "@/services/chatAi";
import { VocabularyItem } from "@/types/vocabulary";
import { useI18n } from "@/componenets/I18nProvider";
import { ARTICLE_TONE, SOURCE_ACCENT } from "@/componenets/vocabulary/sourceColors";
import { ACCENT_TITLE_COLOR, levelThemeVars } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

interface VocabularyModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Present => edit mode; absent => create mode. */
    item?: VocabularyItem | null;
    onSaved: (item: VocabularyItem) => void;
}

interface FormState {
    word: string;
    article: string;
    meaning: string;
    example: string;
}

const EMPTY_FORM: FormState = { word: "", article: "", meaning: "", example: "" };

export default function VocabularyModal({ isOpen, onClose, item, onSaved }: Readonly<VocabularyModalProps>) {
    if (!isOpen) return null;

    return <VocabularyModalForm key={item?.id ?? "new"} onClose={onClose} item={item} onSaved={onSaved} />;
}

function VocabularyModalForm({
    onClose,
    item,
    onSaved,
}: Readonly<Omit<VocabularyModalProps, "isOpen">>) {
    const { t } = useI18n();
    // Lazy-initialized from props once on mount - the parent remounts this form (via the `key`
    // above) whenever it switches between add/edit or between two different items, so there's no
    // need to resync this state in an effect.
    const [form, setForm] = useState<FormState>(() =>
        item
            ? {
                  word: item.word,
                  article: item.article ?? "",
                  meaning: item.meaning,
                  example: item.example ?? "",
              }
            : EMPTY_FORM,
    );
    const [saving, setSaving] = useState(false);
    const [generatingExample, setGeneratingExample] = useState(false);

    const isEdit = Boolean(item);

    const handleClose = () => {
        setForm(EMPTY_FORM);
        onClose();
    };

    const handleGenerateExample = () => {
        if (!form.word.trim()) return;
        setGeneratingExample(true);
        generateAiExample(form.word.trim())
            .then((example) => setForm((f) => ({ ...f, example })))
            .catch((err) => {
                if (!err?.isFeatureLimitError) {
                    console.error(err);
                    toast.error(err?.response?.data?.message ?? t.vocabulary.modal.generateExampleFailed);
                }
            })
            .finally(() => setGeneratingExample(false));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.word.trim() || !form.meaning.trim()) return;
        setSaving(true);

        const request = isEdit && item
            ? updateVocabulary(item.id, {
                  word: form.word.trim(),
                  article: form.article.trim() || null,
                  meaning: form.meaning.trim(),
                  language: item.language,
                  example: form.example.trim() || null,
                  level: item.level ?? null,
              })
            : createVocabulary({
                  word: form.word.trim(),
                  article: form.article.trim() || null,
                  meaning: form.meaning.trim(),
                  language: null,
                  example: form.example.trim() || null,
                  level: null,
              });

        request
            .then((res) => {
                toast.success(isEdit ? t.vocabulary.modal.updated : t.vocabulary.modal.added);
                onSaved(res.data);
                handleClose();
            })
            .catch((err) => {
                console.error(err);
                toast.error(err?.response?.data?.message ?? (isEdit ? t.vocabulary.modal.updateFailed : t.vocabulary.modal.addFailed));
            })
            .finally(() => setSaving(false));
    };

    const field =
        "mt-1.5 w-full rounded-2xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
    const label = "text-xs font-bold uppercase tracking-wide text-primary";
    const ARTICLES = [
        { value: "", text: t.vocabulary.modal.articleNone },
        { value: "der", text: "der" },
        { value: "die", text: "die" },
        { value: "das", text: "das" },
    ];

    return (
        // The dialog always takes the "My words" colour, whichever source list it was opened from.
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" style={levelThemeVars(SOURCE_ACCENT.CUSTOM)}>
            <div className="anim-pop w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-border/60">
                <div className="relative flex items-center justify-between gap-3 overflow-hidden px-6 py-5" style={{ backgroundImage: `linear-gradient(135deg, ${SOURCE_ACCENT.CUSTOM}40, ${SOURCE_ACCENT.CUSTOM}14 70%, transparent)` }}>
                    <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            {isEdit ? <Pencil className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
                        </span>
                        <h2 className="text-lg font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>
                            {isEdit ? t.vocabulary.modal.editTitle : t.vocabulary.modal.addTitle}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label={t.vocabulary.modal.cancel}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-card/80 text-foreground/60 transition hover:bg-card hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div>
                        <label className={label} htmlFor="vocab-word">
                            {t.vocabulary.modal.word}
                        </label>
                        <input
                            id="vocab-word"
                            required
                            autoFocus
                            value={form.word}
                            onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                            className={cn(field, "text-base font-semibold")}
                        />
                    </div>

                    <div>
                        <span id="vocab-article-label" className={label}>
                            {t.vocabulary.modal.article}
                        </span>
                        <div role="radiogroup" aria-labelledby="vocab-article-label" className="mt-1.5 flex flex-wrap gap-2">
                            {ARTICLES.map((opt) => {
                                const selected = form.article === opt.value;
                                const tone = opt.value ? ARTICLE_TONE[opt.value] : "bg-foreground/[0.06] text-foreground/70";
                                return (
                                    <button
                                        key={opt.value || "none"}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setForm((f) => ({ ...f, article: opt.value }))}
                                        className={cn(
                                            "cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                            tone,
                                            selected ? "border-current shadow-sm" : "border-transparent opacity-70 hover:opacity-100",
                                        )}
                                    >
                                        {opt.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className={label} htmlFor="vocab-meaning">
                            {t.vocabulary.modal.meaning}
                        </label>
                        <input
                            id="vocab-meaning"
                            required
                            value={form.meaning}
                            onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
                            className={field}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <label className={label} htmlFor="vocab-example">
                                {t.vocabulary.modal.example}
                            </label>
                            <button
                                type="button"
                                onClick={handleGenerateExample}
                                disabled={!form.word.trim() || generatingExample}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-default disabled:opacity-40"
                            >
                                <Sparkles className={cn("size-3.5", generatingExample && "animate-pulse")} />
                                {generatingExample ? t.vocabulary.modal.generatingExample : t.vocabulary.modal.generateExample}
                            </button>
                        </div>
                        <textarea
                            id="vocab-example"
                            rows={3}
                            value={form.example}
                            onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
                            className={field}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="cursor-pointer rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            {t.vocabulary.modal.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="cursor-pointer rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60"
                        >
                            {saving ? t.vocabulary.modal.saving : t.vocabulary.modal.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
