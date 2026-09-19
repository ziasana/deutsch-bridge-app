"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Sparkles, X } from "lucide-react";
import { createVocabulary, updateVocabulary } from "@/services/vocabularyService";
import { generateAiExample } from "@/services/chatAi";
import { VocabularyItem } from "@/types/vocabulary";
import { useI18n } from "@/componenets/I18nProvider";

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
                console.error(err);
                toast.error(err?.response?.data?.message ?? t.vocabulary.modal.generateExampleFailed);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                        {isEdit ? t.vocabulary.modal.editTitle : t.vocabulary.modal.addTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label={t.vocabulary.modal.cancel}
                        className="flex size-8 items-center justify-center rounded-full text-foreground/50 transition hover:bg-accent hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-foreground/60" htmlFor="vocab-word">
                                {t.vocabulary.modal.word}
                            </label>
                            <input
                                id="vocab-word"
                                required
                                value={form.word}
                                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-foreground/60" htmlFor="vocab-article">
                                {t.vocabulary.modal.article}
                            </label>
                            <select
                                id="vocab-article"
                                value={form.article}
                                onChange={(e) => setForm((f) => ({ ...f, article: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-border/60 bg-background px-2 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                <option value="">{t.vocabulary.modal.articleNone}</option>
                                <option value="der">der</option>
                                <option value="die">die</option>
                                <option value="das">das</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-foreground/60" htmlFor="vocab-meaning">
                            {t.vocabulary.modal.meaning}
                        </label>
                        <input
                            id="vocab-meaning"
                            required
                            value={form.meaning}
                            onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground/60" htmlFor="vocab-example">
                                {t.vocabulary.modal.example}
                            </label>
                            <button
                                type="button"
                                onClick={handleGenerateExample}
                                disabled={!form.word.trim() || generatingExample}
                                className="flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary/80 disabled:opacity-40"
                            >
                                <Sparkles className="size-3.5" />
                                {generatingExample ? t.vocabulary.modal.generatingExample : t.vocabulary.modal.generateExample}
                            </button>
                        </div>
                        <textarea
                            id="vocab-example"
                            rows={3}
                            value={form.example}
                            onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                        >
                            {t.vocabulary.modal.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {saving ? t.vocabulary.modal.saving : t.vocabulary.modal.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
