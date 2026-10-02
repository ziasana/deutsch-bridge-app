"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { getRedemittelHub, getRedemittelPage } from "@/services/redemittelService";
import { Redemittel, RedemittelStatus } from "@/types/redemittel";
import RedemittelRow from "@/componenets/redemittel/RedemittelRow";
import RedemittelExplorer from "@/componenets/redemittel/RedemittelExplorer";
import RedemittelTodayStrip from "@/componenets/redemittel/RedemittelTodayStrip";
import RedemittelHeader from "@/componenets/redemittel/RedemittelHeader";
import RedemittelDayPanel from "@/componenets/redemittel/RedemittelDayPanel";
import RedemittelDetailDialog from "@/componenets/redemittel/RedemittelDetailDialog";
import { useRedemittelActions } from "@/componenets/redemittel/useRedemittelActions";
import { STATUS_LABELS } from "@/componenets/redemittel/redemittelMeta";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

const scrollToList = () => document.getElementById("entdecken")?.scrollIntoView?.({ behavior: "smooth" });

export default function RedemittelPage() {
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [level, setLevel] = useState("ALL");
    const [category, setCategory] = useState("ALL");
    const [status, setStatus] = useState<RedemittelStatus | "ALL">("ALL");
    const [savedOnly, setSavedOnly] = useState(false);
    const [page, setPage] = useState(0);
    const [openId, setOpenId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    // The hub never loads a Redemittel: counts, today's quota and the categories only.
    const { data: hub, error: hubError } = useQuery({
        queryKey: ["redemittel", "hub"],
        queryFn: () => getRedemittelHub().then((res) => res.data),
    });

    const {
        data: list,
        error: listError,
        isPlaceholderData,
    } = useQuery({
        queryKey: ["redemittel", "list", level, category, debouncedSearch, status, savedOnly, page],
        queryFn: () =>
            getRedemittelPage(page, ITEMS_PER_PAGE, {
                level: level === "ALL" ? undefined : level,
                category: category === "ALL" ? undefined : category,
                search: debouncedSearch,
                status: status === "ALL" ? undefined : status,
                saved: savedOnly,
            }).then((res) => res.data),
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        const failure = hubError ?? listError;
        if (failure) {
            const err = failure as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Redemittel konnten nicht geladen werden.");
        }
    }, [hubError, listError]);

    const { toggleSave } = useRedemittelActions();

    const resetPage = () => setPage(0);
    const totalPages = Math.max(1, list?.totalPages ?? 1);
    const items: Redemittel[] = list?.items ?? [];
    const hasFilters = level !== "ALL" || category !== "ALL" || status !== "ALL" || savedOnly || debouncedSearch !== "";

    const clearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setLevel("ALL");
        setCategory("ALL");
        setStatus("ALL");
        setSavedOnly(false);
        resetPage();
    };

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
            <div className="mx-auto max-w-4xl">
                <div className="space-y-6">
                    <RedemittelHeader hub={hub} onNavigate={(href) => router.push(href)} onDiscover={() => scrollToList()} />

                    <RedemittelDayPanel hub={hub} onNavigate={(href) => router.push(href)} onDiscover={() => scrollToList()}>
                        <RedemittelTodayStrip onStart={() => router.push("/dashboard/redemittel/learn")} />
                    </RedemittelDayPanel>

                <section id="entdecken" aria-label="Entdecken" className="scroll-mt-6">
                    <RedemittelExplorer
                        search={search}
                        onSearch={setSearch}
                        level={level}
                        onLevel={(l) => {
                            setLevel(l);
                            resetPage();
                        }}
                        category={category}
                        onCategory={(c) => {
                            setCategory(c);
                            resetPage();
                        }}
                        categories={hub?.categories ?? []}
                        status={status === "ALL" ? null : status}
                        onStatus={(st) => {
                            setStatus(st ?? "ALL");
                            resetPage();
                        }}
                        statusCounts={hub ? { NEW: hub.summary.fresh, LEARNING: hub.summary.learning, REVIEW: hub.summary.review, MASTERED: hub.summary.mastered } : null}
                        canSurprise={items.length > 0}
                        onSurprise={() => {
                            if (items.length === 0) return;
                            setOpenId(items[Math.floor(Math.random() * items.length)].id);
                        }}
                        savedOnly={savedOnly}
                        onToggleSaved={() => {
                            setSavedOnly((v) => !v);
                            resetPage();
                        }}
                        savedCount={hub ? hub.savedCount : null}
                        activeFilters={[
                            ...(level !== "ALL" ? [{ key: "level", label: level, onRemove: () => { setLevel("ALL"); resetPage(); } }] : []),
                            ...(category !== "ALL"
                                ? [{ key: "category", label: hub?.categories.find((c) => c.key === category)?.label ?? category, onRemove: () => { setCategory("ALL"); resetPage(); } }]
                                : []),
                            ...(status !== "ALL" ? [{ key: "status", label: STATUS_LABELS[status], onRemove: () => { setStatus("ALL"); resetPage(); } }] : []),
                            ...(savedOnly ? [{ key: "saved", label: "Meine Sammlung", onRemove: () => { setSavedOnly(false); resetPage(); } }] : []),
                            ...(debouncedSearch ? [{ key: "search", label: `„${debouncedSearch}“`, onRemove: () => { setSearch(""); setDebouncedSearch(""); resetPage(); } }] : []),
                        ]}
                        onReset={clearFilters}
                        footer={
                            totalPages > 1 ? (
                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                                    >
                                        <ChevronLeft className="size-4" aria-hidden="true" />
                                        Zurück
                                    </button>
                                    <span className="text-sm text-foreground/60">
                                        Seite {page + 1} von {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page + 1 >= totalPages || isPlaceholderData}
                                        className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                                    >
                                        Weiter
                                        <ChevronRight className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : undefined
                        }
                    >
                        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
                            {!list && (
                                <ul className="divide-y divide-border/60" aria-hidden="true">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <li key={i} className="flex items-center gap-4 px-5 py-4">
                                            <span className="size-11 animate-pulse rounded-2xl bg-foreground/10" />
                                            <span className="flex-1 space-y-2">
                                                <span className="block h-4 w-1/3 animate-pulse rounded bg-foreground/10" />
                                                <span className="block h-3 w-2/3 animate-pulse rounded bg-foreground/10" />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {items.length > 0 ? (
                                <ul className="divide-y divide-border/60">
                                    {items.map((r, i) => (
                                        <RedemittelRow key={r.id} index={i} redemittel={r} onOpen={(x) => setOpenId(x.id)} onToggleSave={(x) => toggleSave.mutate(x)} />
                                    ))}
                                </ul>
                            ) : (
                                list && (
                                    <div className="px-6 py-12 text-center">
                                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-2xl" aria-hidden="true">
                                            {savedOnly && !hasOtherFilters(level, category, status, debouncedSearch) ? "⭐" : "🔍"}
                                        </div>
                                        {savedOnly && !hasOtherFilters(level, category, status, debouncedSearch) ? (
                                            <>
                                                <p className="mt-3 font-semibold text-foreground">Deine Sammlung ist noch leer.</p>
                                                <p className="mt-1 text-sm text-foreground/55">Speichere Redemittel, die du besonders nützlich findest.</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="mt-3 font-semibold text-foreground">Keine Redemittel gefunden</p>
                                                <p className="mt-1 text-sm text-foreground/55">Ändere deine Suche oder die Filter.</p>
                                            </>
                                        )}
                                        {hasFilters && (
                                            <button type="button" onClick={clearFilters} className="mt-4 text-sm font-medium text-primary hover:underline cursor-pointer">
                                                Filter zurücksetzen
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </RedemittelExplorer>
                </section>
                </div>

                <p className="mt-10 flex items-center justify-center gap-2 text-xs text-foreground/50">
                    <PenLine className="size-3.5" aria-hidden="true" />
                    Du findest Redemittel auch beim Schreiben unter „Schreiben lernen“.
                </p>
            </div>

            <RedemittelDetailDialog redemittelId={openId} onClose={() => setOpenId(null)} />
        </div>
    );
}

function hasOtherFilters(level: string, category: string, status: string, search: string) {
    return level !== "ALL" || category !== "ALL" || status !== "ALL" || search !== "";
}
