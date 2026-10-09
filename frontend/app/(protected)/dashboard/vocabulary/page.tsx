"use client";

import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/componenets/Loading";
import { toast } from "@/lib/toast";
import { PenLine, BookOpen, ArrowRight, ChevronLeft, ChevronRight, Flame, Layers, Sparkles } from "lucide-react";
import { getVocabulary, addVocabularyBookmark, removeVocabularyBookmark, deleteVocabulary } from "@/services/vocabularyService";
import { VocabularyItem, VocabularyMasteryLevel, VocabularySource } from "@/types/vocabulary";
import { LearningSearch } from "@/componenets/learning";
import ExpressionFilterSelect from "@/componenets/expressions/ExpressionFilterSelect";
import VocabularySourceSelector, { VocabularySourceOption } from "@/componenets/vocabulary/VocabularySourceSelector";
import VocabularyHeader from "@/componenets/vocabulary/VocabularyHeader";
import VocabularyCard from "@/componenets/vocabulary/VocabularyCard";
import VocabularyCardSkeleton from "@/componenets/vocabulary/VocabularyCardSkeleton";
import VocabularyModal from "@/componenets/vocabulary/VocabularyModal";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { useI18n } from "@/componenets/I18nProvider";
import { SOURCE_ACCENT } from "@/componenets/vocabulary/sourceColors";
import { ACCENT_TITLE_COLOR, levelThemeVars } from "@/componenets/learning/levelMeta";

const MASTERY_PRIORITY: Record<VocabularyMasteryLevel, number> = {
    LEARNING: 0,
    FAMILIAR: 1,
    NEW: 2,
    MASTERED: 3,
};

const ITEMS_PER_PAGE = 12;
const CONTINUE_LEARNING_COUNT = 3;

const SOURCES: VocabularySource[] = ["CUSTOM", "DICTIONARY", "AI_TUTOR"];
const MASTERIES: VocabularyMasteryLevel[] = ["NEW", "LEARNING", "FAMILIAR", "MASTERED"];

/** useSearchParams needs a Suspense boundary. */
export default function VocabularyPage() {
    return (
        <Suspense fallback={<Loading />}>
            <VocabularyPageContent />
        </Suspense>
    );
}

function VocabularyPageContent() {
    const router = useRouter();
    const params = useSearchParams();
    const { t } = useI18n();
    const [items, setItems] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(true);
    // The list state lives in the URL, so "Back" from a word or a practice session returns to the same source, filters and page.
    const [source, setSource] = useState<VocabularySource>(SOURCES.includes(params.get("source") as VocabularySource) ? (params.get("source") as VocabularySource) : "CUSTOM");
    const [search, setSearch] = useState(params.get("q") ?? "");
    const [masteryFilter, setMasteryFilter] = useState(MASTERIES.includes(params.get("mastery") as VocabularyMasteryLevel) ? (params.get("mastery") as string) : "ALL");
    const [bookmarkFilter, setBookmarkFilter] = useState(params.get("bookmarked") === "1" ? "BOOKMARKED" : "ALL");
    const [page, setPage] = useState(Math.max(1, Number(params.get("page")) || 1));

    useEffect(() => {
        const next = new URLSearchParams();
        if (source !== "CUSTOM") next.set("source", source);
        if (search.trim()) next.set("q", search.trim());
        if (masteryFilter !== "ALL") next.set("mastery", masteryFilter);
        if (bookmarkFilter === "BOOKMARKED") next.set("bookmarked", "1");
        if (page > 1) next.set("page", String(page));
        const query = next.toString();
        router.replace(query ? `/dashboard/vocabulary?${query}` : "/dashboard/vocabulary", { scroll: false });
    }, [source, search, masteryFilter, bookmarkFilter, page, router]);
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
        { source: "AI_TUTOR", label: t.vocabulary.sourceTabs.fromAiTutor, count: items.filter((i) => i.source === "AI_TUTOR").length, icon: Sparkles },
    ];

    const masteryCounts = useMemo(() => {
        const counts: Record<VocabularyMasteryLevel, number> = { NEW: 0, LEARNING: 0, FAMILIAR: 0, MASTERED: 0 };
        sourceItems.forEach((i) => {
            counts[i.progress?.masteryLevel ?? "NEW"] += 1;
        });
        return counts;
    }, [sourceItems]);

    // Words floating in the header: the ones you have started learning (strongest first), topped up with
    // other words so the header never sits still. More learning means more bubbles.
    const showcase = useMemo(() => {
        const order: VocabularyMasteryLevel[] = ["MASTERED", "FAMILIAR", "LEARNING", "NEW"];
        const level = (i: VocabularyItem) => i.progress?.masteryLevel ?? "NEW";
        const started = sourceItems.filter((i) => level(i) !== "NEW").sort((a, b) => order.indexOf(level(a)) - order.indexOf(level(b)));
        const rest = sourceItems.filter((i) => level(i) === "NEW");
        const MIN_BUBBLES = 3;
        const shown = started.length >= MIN_BUBBLES ? started : [...started, ...rest.slice(0, MIN_BUBBLES - started.length)];
        return shown.slice(0, 6).map((i) => ({ word: i.word }));
    }, [sourceItems]);

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
        <div className="min-h-screen bg-background px-6 py-10" style={levelThemeVars(SOURCE_ACCENT[source])}>
            <div className="max-w-4xl mx-auto">
                <VocabularyHeader accent={SOURCE_ACCENT[source]} counts={masteryCounts} showcase={showcase} onAdd={() => setAddOpen(true)} onPractice={() => router.push("/dashboard/vocabulary/practice")} />

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
                        <section className="mt-10 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent p-4 sm:p-6">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                        <Flame className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>{t.vocabulary.continueLearning.title}</h2>
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
                                <div className="mt-4 rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
                                    <p className="text-foreground/60 text-sm">{t.vocabulary.continueLearning.subtitleCaughtUp}</p>
                                </div>
                            )}
                        </section>

                        <section id="all-vocabulary" className="mt-10 scroll-mt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Layers className="size-5" />
                                </div>
                                <h2 className="text-lg font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>{t.vocabulary.allWords.title}</h2>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                    {t.vocabulary.allWords.count(filtered.length)}
                                </span>
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
                                <div className="mt-4 rounded-3xl border border-border/60 bg-card p-10 text-center shadow-card">
                                    <p className="font-semibold text-foreground">{t.vocabulary.empty.title}</p>
                                    <p className="mt-1 text-sm text-foreground/55">{t.vocabulary.empty.subtitle}</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 pt-8">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-default disabled:opacity-40"
                                    >
                                        <ChevronLeft className="size-4" />
                                        {t.vocabulary.previous}
                                    </button>
                                    <span className="text-sm text-foreground/60">{t.vocabulary.pageOf(currentPage, totalPages)}</span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-default disabled:opacity-40"
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

        </div>
    );
}
