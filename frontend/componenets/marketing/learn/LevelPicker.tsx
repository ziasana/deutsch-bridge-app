"use client";

import { LearningLevelOption, LearningLevelSelector } from "@/componenets/learning";
import type { LevelCount } from "@/types/publicLearn";
import { useMarketing } from "../useMarketing";
import type { LearnKind } from "./learnMeta";

/** The dashboard's level cards, showing how much is free instead of progress. Levels without content are left out. */
export default function LevelPicker({ kind, counts, selected, onSelect, className }: Readonly<{ kind: LearnKind; counts: LevelCount[]; selected: string; onSelect: (level: string) => void; className?: string }>) {
    const { m } = useMarketing();
    const l = m.learnPage;
    const options: LearningLevelOption[] = counts
        .filter((c) => c.total > 0)
        .map((c) => ({ level: c.level, total: c.total, completed: c.free, hideProgress: true, detailLabel: l.levelDetail(c.free, c.total, l.unitLabels[kind]) }));
    return <LearningLevelSelector className={className} levels={options} selectedLevel={selected} onLevelChange={onSelect} unitLabel={l.unitLabels[kind]} activeLabel={l.currentLevel} ariaLabel="Level" />;
}
