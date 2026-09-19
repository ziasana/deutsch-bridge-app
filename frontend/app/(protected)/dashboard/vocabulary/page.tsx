"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { PenLine, BookOpen, Play, ArrowRight, ChevronLeft, ChevronRight, Flame, Layers, Library, Plus } from "lucide-react";
import { getVocabulary, addVocabularyBookmark, removeVocabularyBookmark, deleteVocabulary } from "@/services/vocabularyService";
import { VocabularyItem, VocabularyMasteryLevel, VocabularySource } from "@/types/vocabulary";
import { LearningSearch } from "@/componenets/learning";
import ExpressionFilterSelect from "@/componenets/expressions/ExpressionFilterSelect";
import VocabularySourceSelector, { VocabularySourceOption } from "@/componenets/vocabulary/VocabularySourceSelector";
import VocabularyCard from "@/componenets/vocabulary/VocabularyCard";
import VocabularyCardSkeleton from "@/componenets/vocabulary/VocabularyCardSkeleton";
import VocabularyModal from "@/componenets/vocabulary/VocabularyModal";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { useI18n } from "@/componenets/I18nProvider";

const MASTERY_PRIORITY: Record<VocabularyMasteryLevel, number> = {
    LEARNING: 0,
    FAMILIAR: 1,
    NEW: 2,
    MASTERED: 3,
};

const ITEMS_PER_PAGE = 12;
const CONTINUE_LEARNING_COUNT = 3;

export default function VocabularyPage() {
    const router = useRouter();
    const { t } = useI18n();
    const [items, setItems] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<VocabularySource>("CUSTOM");
    const [search, setSearch] = useState("");
    const [masteryFilter, setMasteryFilter] = useState("ALL");
    const [bookmarkFilter, setBookmarkFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [addOpen, setAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<VocabularyItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<VocabularyItem | null>(null);

    const loadList = () => {
        getVocabulary()
            .then((res) => setItems(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadList();
    }, []);

    const toggleBookmark = (item: VocabularyItem) => {
        const wasBookmarked = item.bookmarked;
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, bookmarked: !wasBookmarked } : i)));

        const request = wasBookmarked ? removeVocabularyBookmark(item.id) : addVocabularyBookmark(item.id);
        request.catch((err) => {
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, bookmarked: wasBookmarked } : i)));
            toast.error(err?.response?.data?.message ?? "Failed to update bookmark.");
        });
    };

    const handleDelete = (item: VocabularyItem) => setDeleteItem(item);

    const confirmDelete = () => {
        const item = deleteItem;
        if (!item) return;
        setDeleteItem(null);
        deleteVocabulary(item.id)
            .then(() => {
                setItems((prev) => prev.filter((i) => i.id !== item.id));
                toast.success(t.vocabulary.deleted);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? t.vocabulary.deleteFailed));
    };

    const resetPage = () => setPage(1);

    const sourceItems = useMemo(() => items.filter((i) => i.source === source), [items, source]);

    const sourceOptions: VocabularySourceOption[] = [
        { source: "CUSTOM", label: t.vocabulary.sourceTabs.myWords, count: items.filter((i) => i.source === "CUSTOM").length, icon: PenLine },
        { source: "DICTIONARY", label: t.vocabulary.sourceTabs.fromReading, count: items.filter((i) => i.source === "DICTIONARY").length, icon: BookOpen },
    ];

    const continueLearning = useMemo(() => {
        const candidates = sourceItems.filter((i) => (i.progress?.masteryLevel ?? "NEW") !== "MASTERED");
        const sorted = [...candidates].sort((a, b) => {
            const pa = MASTERY_PRIORITY[a.progress?.masteryLevel ?? "NEW"];
            const pb = MASTERY_PRIORITY[b.progress?.masteryLevel ?? "NEW"];
            if (pa !== pb) return pa - pb;
            return (a.progress?.overallScore ?? 0) - (b.progress?.overallScore ?? 0);
        });
        return { list: sorted.slice(0, CONTINUE_LEARNING_COUNT), readyCount: candidates.length };
    }, [sourceItems]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return sourceItems.filter((i) => {
            const mastery = i.progress?.masteryLevel ?? "NEW";
            if (masteryFilter !== "ALL" && mastery !== masteryFilter) return false;
            if (bookmarkFilter === "BOOKMARKED" && !i.bookmarked) return false;
            if (!term) return true;
            return (
                i.word.toLowerCase().includes(term) ||
                i.meaning.toLowerCase().includes(term) ||
                (i.example ?? "").toLowerCase().includes(term)
            );
        });
    }, [sourceItems, search, masteryFilter, bookmarkFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const openItem = (item: VocabularyItem) => router.push(`/dashboard/vocabulary/detail?id=${item.id}`);
    const practiceItem = (item: VocabularyItem) => router.push(`/dashboard/vocabulary/practice?vocabularyItemId=${item.id}`);

    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent">
                            <Library className="size-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{t.vocabulary.title}</h1>
                            <p className="mt-1 text-sm text-foreground/60">{t.vocabulary.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAddOpen(true)}
                            className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-card transition hover:bg-accent"
                        >
                            <Plus className="size-4" />
                            {t.vocabulary.addNew}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/vocabulary/practice")}
                            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Play className="size-3.5 fill-current" />
                            {t.vocabulary.practiceCta}
                            <ArrowRight className="size-4" />
                        </button>
                    </div>
                </header>

                <VocabularySourceSelector
                    className="mt-8"
                    options={sourceOptions}
                    selected={source}
                    onSelect={(s) => {
                        setSource(s);
                        resetPage();
                    }}
                />

                <div className="mt-6 flex flex-wrap items-start gap-3">
                    <LearningSearch
                        className="flex-1 min-w-[240px]"
                        value={search}
                        onChange={(value) => {
                            setSearch(value);
                            resetPage();
                        }}
                        placeholder={t.vocabulary.searchPlaceholder}
                    />
                    <ExpressionFilterSelect
                        label={t.vocabulary.filters.mastery}
                        value={masteryFilter}
                        onChange={(v) => {
                            setMasteryFilter(v);
                            resetPage();
                        }}
                        options={[
                            { value: "ALL", label: t.vocabulary.filters.all },
                            ...(Object.keys(t.vocabulary.mastery) as VocabularyMasteryLevel[]).map((m) => ({
                                value: m,
                                label: t.vocabulary.mastery[m],
                            })),
                        ]}
                    />
                    <ExpressionFilterSelect
                        label={t.vocabulary.filters.bookmarked}
                        value={bookmarkFilter}
                        onChange={(v) => {
                            setBookmarkFilter(v);
                            resetPage();
                        }}
                        options={[
                            { value: "ALL", label: t.vocabulary.filters.all },
                            { value: "BOOKMARKED", label: t.vocabulary.filters.bookmarkedOnly },
                        ]}
                    />
                </div>

                {loading ? (
                    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <VocabularyCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        <section className="mt-10">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                                        <Flame className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">{t.vocabulary.continueLearning.title}</h2>
                                        <p className="mt-0.5 text-sm text-foreground/55">
                                            {continueLearning.readyCount > 0
                                                ? t.vocabulary.continueLearning.subtitleReady(continueLearning.readyCount)
                                                : t.vocabulary.continueLearning.subtitleCaughtUp}
                                        </p>
                                    </div>
                                </div>
                                {continueLearning.readyCount > CONTINUE_LEARNING_COUNT && (
                                    <a
                                        href="#all-vocabulary"
                                        className="shrink-0 text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        {t.vocabulary.continueLearning.seeAll}
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                )}
                            </div>

                            {continueLearning.list.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {continueLearning.list.map((item) => (
                                        <VocabularyCard
                                            key={item.id}
                                            item={item}
                                            onOpen={openItem}
                                            onPractice={practiceItem}
                                            onToggleBookmark={toggleBookmark}
                                            onEdit={(i) => setEditItem(i)}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                                    <p className="text-foreground/60 text-sm">{t.vocabulary.continueLearning.subtitleCaughtUp}</p>
                                </div>
                            )}
                        </section>

                        <section id="all-vocabulary" className="mt-10 scroll-mt-6">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                                        <Layers className="size-5 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground">{t.vocabulary.allWords.title}</h2>
                                </div>
                                <span className="text-sm text-foreground/55">{t.vocabulary.allWords.count(filtered.length)}</span>
                            </div>

                            {paginated.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginated.map((item) => (
                                        <VocabularyCard
                                            key={item.id}
                                            item={item}
                                            onOpen={openItem}
                                            onPractice={practiceItem}
                                            onToggleBookmark={toggleBookmark}
                                            onEdit={(i) => setEditItem(i)}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card">
                                    <p className="font-semibold text-foreground">{t.vocabulary.empty.title}</p>
                                    <p className="mt-1 text-sm text-foreground/55">{t.vocabulary.empty.subtitle}</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 pt-8">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                                    >
                                        <ChevronLeft className="size-4" />
                                        {t.vocabulary.previous}
                                    </button>
                                    <span className="text-sm text-foreground/60">{t.vocabulary.pageOf(currentPage, totalPages)}</span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                                    >
                                        {t.vocabulary.next}
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            <VocabularyModal
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                onSaved={(item) => setItems((prev) => [item, ...prev])}
            />
            <VocabularyModal
                isOpen={Boolean(editItem)}
                item={editItem}
                onClose={() => setEditItem(null)}
                onSaved={(item) => setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))}
            />

            <ConfirmDialog
                isOpen={Boolean(deleteItem)}
                title={t.vocabulary.confirmDeleteTitle}
                message={t.vocabulary.confirmDelete}
                confirmLabel={t.vocabulary.deleteAction}
                cancelLabel={t.vocabulary.cancelAction}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteItem(null)}
            />

            <ToastContainer />
        </div>
    );
}
