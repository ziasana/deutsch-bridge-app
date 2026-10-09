"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import { ChevronRight } from "lucide-react";
import { getExamExercisesSummary, getExamLevelSummary } from "@/services/examService";
import { ExamSection } from "@/types/exam";
import Loading from "@/componenets/Loading";
import {
    CurrentLevelChip,
    LearningLevelOption,
    LearningLevelSelector,
    LearningSearch,
    SavedItemsButton,
    SavedItemsLabels,
    SavedItemsPanel,
} from "@/componenets/learning";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import {
    ContinueLearningCard,
    EXAM_TYPE_META,
    EXAM_TYPE_ORDER,
    ExamExerciseList,
    ExamPartCard,
    ExamTypeSelector,
    averageScore,
    exercisesForSectionAndLevel,
    findContinueTarget,
    groupIntoParts,
    masteredCount,
} from "@/componenets/exam";
import { ContentItemRow } from "@/componenets/CategoryAccordion";
import useAuthStore from "@/store/useAuthStore";
import TeilTimeCard from "@/componenets/exam/TeilTimeCard";
import { useExerciseLastTimes } from "@/hooks/exam/useExerciseLastTimes";
import { usePendingExamBookmarks } from "@/hooks/exam/usePendingExamBookmarks";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";

const SAVED_LABELS: SavedItemsLabels = {
    title: "Für später gemerkt",
    subtitle: (count) =>
        `${count} gemerkte ${count === 1 ? "Aufgabe wartet" : "Aufgaben warten"} noch. Schließe sie ab, bevor du etwas Neues beginnst.`,
    waiting: (days) => `Seit ${days} Tagen offen`,
    more: (count) => `+${count} weitere`,
    remove: "Merkzeichen entfernen",
};

const VALID_SECTIONS = new Set<string>(EXAM_TYPE_ORDER);

function ExamPrepContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();

    // Small, ~one row per level, regardless of how many exercises exist - fetched once and reused
    // both for the level selector and to pick a fallback level before the exercises query below
    // even knows which level to scope to.
    const { data: levelSummaries = [], isLoading: levelSummaryLoading, error: levelSummaryError } = useQuery({
        queryKey: ["exam", "level-summary"],
        queryFn: () => getExamLevelSummary().then((res) => res.data),
    });

    const initialSection = searchParams.get("section");
    const initialLevel = searchParams.get("level");
    const [selectedLevel, setSelectedLevel] = useState<string | null>(initialLevel);
    const [selectedSection, setSelectedSection] = useState<ExamSection>(
        initialSection && VALID_SECTIONS.has(initialSection) ? (initialSection as ExamSection) : "LESEVERSTEHEN",
    );
    const [search, setSearch] = useState("");
    const { data: pendingBookmarks = [] } = usePendingExamBookmarks();
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useExamBookmark();
    const [savedOpen, setSavedOpen] = useState(false);

    // Keep the picked section/level in the URL (replacing, not adding a history entry), so that
    // "Zurück" from an exercise reopens this same view instead of the default one.
    const syncUrl = (patch: { section?: ExamSection; level?: string }) => {
        const params = new URLSearchParams(window.location.search);
        if (patch.section) params.set("section", patch.section);
        if (patch.level) params.set("level", patch.level);
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    };
    const chooseSection = (section: ExamSection) => {
        // Schreiben has its own landing: learn first, then practise.
        if (section === "SCHRIFTLICHER_AUSDRUCK" && selectedSection !== section) {
            router.push(`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(effectiveLevel)}`);
            return;
        }
        // Mündlicher Ausdruck too: learn each Teil first (Lernbereich), then practise.
        if (section === "MUENDLICHER_AUSDRUCK" && selectedSection !== section) {
            router.push(`/dashboard/exam-prep/sprechen?level=${encodeURIComponent(effectiveLevel)}`);
            return;
        }
        setSelectedSection(section);
        syncUrl({ section });
    };
    const chooseLevel = (level: string) => {
        setSelectedLevel(level);
        syncUrl({ level });
    };

    // The backend can send the literal string "null" for an unset profile level.
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const effectiveLevel = selectedLevel ?? profileLevel ?? levelSummaries[0]?.level ?? "B1";
    const writingLastTimes = useExerciseLastTimes("SCHRIFTLICHER_AUSDRUCK", selectedSection === "SCHRIFTLICHER_AUSDRUCK" ? effectiveLevel : null);

    // Every section at the current level only - never the whole table. Refetches (and caches,
    // per level) the first time a level is opened; switching section alone needs no new fetch.
    const { data: exercises = [], isLoading: exercisesLoading, error } = useQuery({
        queryKey: ["exam", "exercises", effectiveLevel],
        queryFn: () => getExamExercisesSummary(undefined, effectiveLevel).then((res) => res.data),
        enabled: !levelSummaryLoading,
    });

    useEffect(() => {
        const failure = error ?? levelSummaryError;
        if (failure) {
            const err = failure as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load exercises.");
        }
    }, [error, levelSummaryError]);

    if (levelSummaryLoading || exercisesLoading) return <Loading />;

    const levelOptions: LearningLevelOption[] = levelSummaries.map((s) => ({
        level: s.level,
        total: s.total,
        completed: s.mastered,
        percentOverride: s.avgScore,
    }));

    const examTypeOptions = EXAM_TYPE_ORDER.map((section) => {
        const meta = EXAM_TYPE_META[section];
        if (meta.informational) {
            return { section, partsCount: 0, mastered: 0, total: 0, avgScore: 0 };
        }
        const items = exercisesForSectionAndLevel(exercises, section, effectiveLevel);
        const groups = groupIntoParts(items, section);
        return { section, partsCount: groups.length, mastered: masteredCount(items), total: items.length, avgScore: averageScore(items) };
    });

    const continueTarget = findContinueTarget(exercises, effectiveLevel, selectedSection);

    const selectedMeta = EXAM_TYPE_META[selectedSection];
    const selectedItems = exercisesForSectionAndLevel(exercises, selectedSection, effectiveLevel);
    const searchTerm = search.trim().toLowerCase();

    // Schriftlicher Ausdruck has no Teile: its Übungen are listed directly instead of as Teil cards.
    const isFlatList = selectedSection === "SCHRIFTLICHER_AUSDRUCK";
    const flatItems = isFlatList
        ? (groupIntoParts(selectedItems, selectedSection)[0]?.items ?? []).filter(
              (i) => searchTerm === "" || i.title.toLowerCase().includes(searchTerm),
          )
        : [];

    const selectedGroups = isFlatList
        ? []
        : groupIntoParts(selectedItems, selectedSection).filter(
              (g) => searchTerm === "" || g.label.toLowerCase().includes(searchTerm) || g.items.some((i) => i.title.toLowerCase().includes(searchTerm)),
          );
    const infoItems = selectedMeta.informational
        ? selectedItems.filter((i) => searchTerm === "" || i.title.toLowerCase().includes(searchTerm))
        : [];

    const selectedFilteredItems = isFlatList ? flatItems : selectedGroups.flatMap((g) => g.items);
    const selectedMastered = masteredCount(selectedFilteredItems);
    const selectedTotal = selectedFilteredItems.length;
    const selectedAvgScore = averageScore(selectedFilteredItems);

    const openPart = (section: ExamSection, level: string, partKey: string, exerciseId: string, onlyExercise: boolean) => {
        if (onlyExercise) {
            router.push(`/dashboard/exam-prep/exercise?id=${exerciseId}`);
        } else {
            router.push(`/dashboard/exam-prep/teil?section=${section}&level=${encodeURIComponent(level)}&part=${encodeURIComponent(partKey)}`);
        }
    };

    const savedItems = pendingBookmarks.map((b) => ({
        id: b.id,
        level: b.level ?? "",
        bookmarkedAt: b.bookmarkedAt,
        title: `${EXAM_TYPE_META[b.section]?.label ?? b.section}: ${b.title}`,
    }));
    const openSaved = (id: string) => router.push(`/dashboard/exam-prep/exercise?id=${id}`);

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <LearningPageHero
                    icon={selectedMeta.icon}
                    title="Prüfungsvorbereitung"
                    subtitle="Bereite dich Schritt für Schritt auf die Deutschprüfung vor."
                    bubbles
                    actionsBelow
                    actions={
                        savedItems.length > 0 && (
                            <SavedItemsButton
                                items={savedItems}
                                labels={SAVED_LABELS}
                                open={savedOpen}
                                onToggle={() => setSavedOpen((v) => !v)}
                                onOpen={openSaved}
                            />
                        )
                    }
                    meta={<CurrentLevelChip onSelect={chooseLevel} title="Dein aktuelles Niveau" />}
                />

                {savedOpen && savedItems.length > 0 && (
                    <SavedItemsPanel
                        items={savedItems}
                        labels={SAVED_LABELS}
                        onOpen={openSaved}
                        onRemove={(id) => toggleBookmark(id, true)}
                        removingId={bookmarkPendingId}
                    />
                )}

                <ExamTypeSelector
                    className="mt-6"
                    types={examTypeOptions}
                    selected={selectedSection}
                    onSelect={chooseSection}
                />

                <h2 className="mt-8 text-sm font-semibold text-foreground/70">Prüfungsniveau</h2>
                <LearningLevelSelector
                    className="mt-3"
                    levels={levelOptions}
                    selectedLevel={effectiveLevel}
                    onLevelChange={chooseLevel}
                    unitLabel="Aufgaben"
                    activeLabel="Aktuelles Niveau"
                    ariaLabel="Prüfungsniveau"
                />

                <LearningSearch
                    className="mt-6"
                    value={search}
                    onChange={setSearch}
                    placeholder="Suche nach Prüfungsteil oder Aufgabe..."
                />

                {continueTarget && (
                    <div className="mt-6">
                        <ContinueLearningCard
                            typeLabel={EXAM_TYPE_META[continueTarget.section].label}
                            typeIcon={EXAM_TYPE_META[continueTarget.section].icon}
                            partLabel={continueTarget.partLabel}
                            mastered={continueTarget.mastered}
                            total={continueTarget.total}
                            avgScore={continueTarget.avgScore}
                            state={continueTarget.state}
                            onNavigate={() => router.push(`/dashboard/exam-prep/exercise?id=${continueTarget.exerciseId}`)}
                        />
                    </div>
                )}

                <div className="mt-8 rounded-[10px] bg-card shadow-card overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60">
                        <div className="flex items-center gap-3 min-w-0">
                            <span
                                className="flex size-10 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${selectedMeta.color}1a` }}
                            >
                                <selectedMeta.icon className="size-5" style={{ color: selectedMeta.color }} />
                            </span>
                            <div className="min-w-0">
                                <div className="font-semibold text-foreground">{selectedMeta.label}</div>
                                <p className="text-sm text-foreground/55">{selectedMeta.description}</p>
                            </div>
                        </div>
                        {!selectedMeta.informational && (
                            <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-baseline justify-between text-xs">
                                        <span className="text-foreground/55">
                                            {selectedMastered} / {selectedTotal} Aufgaben
                                        </span>
                                        <span className="font-medium text-foreground/70">{selectedAvgScore}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{ width: `${selectedAvgScore}%`, backgroundColor: selectedMeta.color }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                        {selectedMeta.informational ? (
                            <>
                                {infoItems.map((item) => (
                                    <ContentItemRow
                                        key={item.id}
                                        title={item.title}
                                        description={item.teilDescription ?? undefined}
                                        onClick={() => router.push(`/dashboard/exam-prep/exercise?id=${item.id}`)}
                                    />
                                ))}
                                {infoItems.length === 0 && (
                                    <div className="text-center text-foreground/50 py-6 text-sm">
                                        Noch keine Informationen verfügbar.
                                    </div>
                                )}
                            </>
                        ) : isFlatList ? (
                            <>
                                <Link
                                    href={`/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(effectiveLevel)}`}
                                    className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition"
                                >
                                    <span>📚 Erst lernen: So löst du eine Schreibaufgabe</span>
                                    <ChevronRight className="size-4 text-foreground/40" />
                                </Link>
                                <TeilTimeCard section={selectedSection} level={effectiveLevel} teil={1} showLastResult={false} />
                                <ExamExerciseList
                                    key={`${selectedSection}-${effectiveLevel}-${searchTerm}`}
                                    items={flatItems}
                                    color={selectedMeta.color}
                                    lastTimes={writingLastTimes}
                                />
                            </>
                        ) : (
                            <>
                                {selectedGroups.map((group, i) => (
                                    <ExamPartCard
                                        key={group.key}
                                        index={i + 1}
                                        title={group.label}
                                        exerciseCount={group.total}
                                        mastered={group.mastered}
                                        total={group.total}
                                        avgScore={group.avgScore}
                                        state={group.state}
                                        color={selectedMeta.color}
                                        onClick={() =>
                                            openPart(selectedSection, effectiveLevel, group.key, group.items[0].id, group.items.length === 1)
                                        }
                                    />
                                ))}
                                {selectedGroups.length === 0 && (
                                    <div className="text-center text-foreground/50 py-6 text-sm">
                                        Keine Übungen für diesen Filter gefunden.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExamPrepPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExamPrepContent />
        </Suspense>
    );
}
