"use client";

import DtzOralList from "@/componenets/exam/dtzOral/DtzOralList";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import { getExamExercisesSummary, getExamLevelSummary } from "@/services/examService";
import { ExamSection, ExamTypeCode } from "@/types/exam";
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
    EXAM_TYPE_BY_CODE,
    EXAM_TYPE_META,
    EXAM_TYPE_ORDER,
    ExamPartCard,
    ExamTypeSelector,
    ExamTypeSwitch,
    averageScore,
    exercisesForSectionAndLevel,
    findContinueTarget,
    groupIntoParts,
    masteredCount,
} from "@/componenets/exam";
import { ContentItemRow } from "@/componenets/CategoryAccordion";
import useAuthStore from "@/store/useAuthStore";
import WritingTaskList from "@/componenets/exam/writing/WritingTaskList";
import ExamPartList from "@/componenets/exam/ExamPartList";
import { LessonAccent, SECTION_THEME, accentColor, lessonThemeVars } from "@/componenets/exam/lessonTheme";
import SpeakingExamList from "@/componenets/exam/speaking/SpeakingExamList";
import { speakingHubHref } from "@/componenets/exam/speaking/speakingMeta";
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

    const initialExam = searchParams.get("exam");
    const [examType, setExamType] = useState<ExamTypeCode>(initialExam === "DTZ" ? "DTZ" : "TELC");
    const examInfo = EXAM_TYPE_BY_CODE[examType];
    const isTelc = examType === "TELC";

    // Small, ~one row per level, regardless of how many exercises exist - fetched once and reused
    // both for the level selector and to pick a fallback level before the exercises query below
    // even knows which level to scope to.
    const { data: levelSummaries = [], isLoading: levelSummaryLoading, error: levelSummaryError } = useQuery({
        queryKey: ["exam", "level-summary", examType],
        queryFn: () => getExamLevelSummary(examType).then((res) => res.data),
    });

    const initialSection = searchParams.get("section");
    const initialLevel = searchParams.get("level");
    const [selectedLevel, setSelectedLevel] = useState<string | null>(initialLevel);
    const [selectedSection, setSelectedSection] = useState<ExamSection>(
        initialSection && VALID_SECTIONS.has(initialSection) && EXAM_TYPE_BY_CODE[initialExam === "DTZ" ? "DTZ" : "TELC"].sections.includes(initialSection as ExamSection)
            ? (initialSection as ExamSection)
            : "LESEVERSTEHEN",
    );
    const [search, setSearch] = useState("");
    const { data: pendingBookmarks = [] } = usePendingExamBookmarks();
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useExamBookmark();
    const [savedOpen, setSavedOpen] = useState(false);

    // Keep the picked section/level in the URL (replacing, not adding a history entry), so that
    // "Zurück" from an exercise reopens this same view instead of the default one.
    const syncUrl = (patch: { section?: ExamSection; level?: string; exam?: ExamTypeCode }) => {
        const params = new URLSearchParams(window.location.search);
        if (patch.section) params.set("section", patch.section);
        if (patch.level) params.set("level", patch.level);
        if (patch.exam) params.set("exam", patch.exam);
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    };
    const chooseSection = (section: ExamSection) => {
        // Telc Schreiben has its own landing: learn first, then practise. DTZ Schreiben (Aufgabe A oder B) lists its exercises right here.
        if (section === "SCHRIFTLICHER_AUSDRUCK" && selectedSection !== section && examType !== "DTZ") {
            router.push(`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(effectiveLevel)}`);
            return;
        }
        // Mündlicher Ausdruck (Telc) and the DTZ Mündliche Prüfung: learn each Teil first (Lernbereich), then practise.
        if (section === "MUENDLICHER_AUSDRUCK" && selectedSection !== section) {
            router.push(speakingHubHref(effectiveLevel, examType === "DTZ" ? "DTZ" : "TELC"));
            return;
        }
        setSelectedSection(section);
        syncUrl({ section });
    };
    // Switching the exam restarts at Lesen; DTZ has one fixed level, Telc goes back to the learner's own level choice.
    const chooseExamType = (next: ExamTypeCode) => {
        if (next === examType) return;
        const info = EXAM_TYPE_BY_CODE[next];
        setExamType(next);
        setSelectedSection("LESEVERSTEHEN");
        setSelectedLevel(info.fixedLevel ?? null);
        setSearch("");
        syncUrl({ exam: next, section: "LESEVERSTEHEN", level: info.fixedLevel ?? profileLevel ?? "B1" });
    };
    const chooseLevel = (level: string) => {
        setSelectedLevel(level);
        syncUrl({ level });
    };

    // The backend can send the literal string "null" for an unset profile level.
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const effectiveLevel = examInfo.fixedLevel ?? selectedLevel ?? profileLevel ?? levelSummaries[0]?.level ?? "B1";
    const speakingLastTimes = useExerciseLastTimes("MUENDLICHER_AUSDRUCK", selectedSection === "MUENDLICHER_AUSDRUCK" ? effectiveLevel : null);
    const writingLastTimes = useExerciseLastTimes("SCHRIFTLICHER_AUSDRUCK", selectedSection === "SCHRIFTLICHER_AUSDRUCK" ? effectiveLevel : null);

    // Every section at the current level only - never the whole table. Refetches (and caches,
    // per level) the first time a level is opened; switching section alone needs no new fetch.
    const { data: exercises = [], isLoading: exercisesLoading, error } = useQuery({
        queryKey: ["exam", "exercises", examType, effectiveLevel],
        queryFn: () => getExamExercisesSummary(undefined, effectiveLevel, undefined, examType).then((res) => res.data),
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

    const examTypeOptions = examInfo.sections.map((section) => {
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
            router.push(`/dashboard/exam-prep/teil?section=${section}&level=${encodeURIComponent(level)}&part=${encodeURIComponent(partKey)}&exam=${examType}`);
        }
    };

    const savedItems = pendingBookmarks.map((b) => ({
        id: b.id,
        level: b.level ?? "",
        bookmarkedAt: b.bookmarkedAt,
        title: `${EXAM_TYPE_META[b.section]?.label ?? b.section}: ${b.title}`,
    }));
    const openSaved = (id: string) => router.push(`/dashboard/exam-prep/exercise?id=${id}`);

    // Each exam section has its colour (Lesen teal, Sprachbausteine violet, Hören green, Sprechen pink, Schreiben orange).
    const sectionAccent: LessonAccent | undefined =
        SECTION_THEME[selectedSection]?.accent ??
        (selectedSection === "MUENDLICHER_AUSDRUCK" ? "speaking" : selectedSection === "SCHRIFTLICHER_AUSDRUCK" ? "writing" : undefined);

    return (
        <div
            className="min-h-screen bg-background px-6 py-10"
            dir="ltr"
            style={sectionAccent ? lessonThemeVars(sectionAccent) : undefined}
        >
            <div className="max-w-4xl mx-auto">
                <LearningPageHero
                    icon={selectedMeta.icon}
                    title="Prüfungsvorbereitung"
                    subtitle="Bereite dich Schritt für Schritt auf die Deutschprüfung vor."
                    accent={sectionAccent ? accentColor(sectionAccent) : undefined}
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
                    meta={
                        isTelc ? (
                            <CurrentLevelChip onSelect={chooseLevel} title="Dein aktuelles Niveau" />
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                {examInfo.label}
                            </span>
                        )
                    }
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

                <ExamTypeSwitch className="mt-6" selected={examType} onSelect={chooseExamType} />

                {isTelc && (
                <Link
                    href="/dashboard/exam-prep/pruefung"
                    className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4 transition hover:bg-primary/10"
                >
                    <span className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <ClipboardCheck className="size-5" aria-hidden="true" />
                        </span>
                        <span>
                            <span className="block text-sm font-bold text-foreground">Probeprüfung</span>
                            <span className="block text-xs text-foreground/60">Eine komplette Prüfung mit Zeitlimit und Auswertung – ohne Wiederholung von Aufgaben.</span>
                        </span>
                    </span>
                    <span className="text-sm font-semibold text-primary">Starten →</span>
                </Link>
                )}

                <ExamTypeSelector
                    className="mt-6"
                    types={examTypeOptions}
                    selected={selectedSection}
                    onSelect={chooseSection}
                />

                {isTelc && (
                    <>
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
                    </>
                )}

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
                            <WritingTaskList
                                key={`${selectedSection}-${effectiveLevel}-${searchTerm}`}
                                items={flatItems}
                                level={effectiveLevel}
                                examType={examType}
                                lastTimes={writingLastTimes}
                            />
                        ) : selectedSection === "MUENDLICHER_AUSDRUCK" && examType === "DTZ" ? (
                            <DtzOralList key={`${selectedSection}-${effectiveLevel}-${searchTerm}`} groups={selectedGroups} />
                        ) : selectedSection === "MUENDLICHER_AUSDRUCK" ? (
                            <SpeakingExamList key={`${selectedSection}-${effectiveLevel}-${searchTerm}`} groups={selectedGroups} level={effectiveLevel} lastTimes={speakingLastTimes} />
                        ) : SECTION_THEME[selectedSection] ? (
                            <ExamPartList
                                section={selectedSection}
                                level={effectiveLevel}
                                accent={SECTION_THEME[selectedSection]!.accent}
                                examType={examType}
                                groups={selectedGroups}
                                onOpen={(group) => openPart(selectedSection, effectiveLevel, group.key, group.items[0].id, group.items.length === 1)}
                            />
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
