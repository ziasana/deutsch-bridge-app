"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import { BarChart3, ChevronRight } from "lucide-react";
import { getExamExercises } from "@/services/examService";
import { ExamExercisePublicResponse, ExamSection } from "@/types/exam";
import Loading from "@/componenets/Loading";
import { LearningLevelSelector, LearningSearch } from "@/componenets/learning";
import {
    ContinueLearningCard,
    EXAM_TYPE_META,
    EXAM_TYPE_ORDER,
    ExamPartCard,
    ExamTypeSelector,
    averageScore,
    buildLevelOptions,
    exercisesForSectionAndLevel,
    findContinueTarget,
    groupIntoParts,
    masteredCount,
} from "@/componenets/exam";
import { ContentItemRow } from "@/componenets/CategoryAccordion";
import useAuthStore from "@/store/useAuthStore";

const VALID_SECTIONS = new Set<string>(EXAM_TYPE_ORDER);

function ExamPrepContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const { data: exercises = [], isLoading: loading, error } = useQuery<ExamExercisePublicResponse[]>({
        queryKey: ["exam", "exercises"],
        queryFn: () => getExamExercises().then((res) => res.data),
    });

    const initialSection = searchParams.get("section");
    const initialLevel = searchParams.get("level");
    const [selectedLevel, setSelectedLevel] = useState<string | null>(initialLevel);
    const [selectedSection, setSelectedSection] = useState<ExamSection>(
        initialSection && VALID_SECTIONS.has(initialSection) ? (initialSection as ExamSection) : "LESEVERSTEHEN",
    );
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load exercises.");
        }
    }, [error]);

    if (loading) return <Loading />;

    const levelOptions = buildLevelOptions(exercises);
    // The backend can send the literal string "null" for an unset profile level.
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const effectiveLevel = selectedLevel ?? profileLevel ?? levelOptions[0]?.level ?? "B1";

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

    const selectedGroups = groupIntoParts(selectedItems, selectedSection).filter(
        (g) => searchTerm === "" || g.label.toLowerCase().includes(searchTerm) || g.items.some((i) => i.title.toLowerCase().includes(searchTerm)),
    );
    const infoItems = selectedMeta.informational
        ? selectedItems.filter((i) => searchTerm === "" || i.title.toLowerCase().includes(searchTerm))
        : [];

    const selectedFilteredItems = selectedGroups.flatMap((g) => g.items);
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

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent">
                            <selectedMeta.icon className="size-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Prüfungsvorbereitung</h1>
                            <p className="text-foreground/60 mt-1 text-sm max-w-md">
                                Bereite dich Schritt für Schritt auf die Deutschprüfung vor. Übe gezielt mit echten
                                Prüfungsformaten und verbessere deine Fertigkeiten.
                            </p>
                        </div>
                    </div>

                    {profileLevel && (
                        <button
                            type="button"
                            onClick={() => setSelectedLevel(profileLevel)}
                            className="flex items-center gap-3 rounded-2xl bg-card shadow-card px-4 py-3 text-left shrink-0 hover:bg-accent/40 transition"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
                                <BarChart3 className="size-4.5 text-primary" />
                            </span>
                            <div className="min-w-0">
                                <div className="text-xs text-foreground/50">Dein aktuelles Niveau</div>
                                <div className="font-semibold text-foreground">{profileLevel}</div>
                            </div>
                            <ChevronRight className="size-4 text-foreground/30 shrink-0" />
                        </button>
                    )}
                </div>

                <ExamTypeSelector
                    className="mt-6"
                    types={examTypeOptions}
                    selected={selectedSection}
                    onSelect={setSelectedSection}
                />

                <h2 className="mt-8 text-sm font-semibold text-foreground/70">Prüfungsniveau</h2>
                <LearningLevelSelector
                    className="mt-3"
                    levels={levelOptions}
                    selectedLevel={effectiveLevel}
                    onLevelChange={(level) => setSelectedLevel(level)}
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
