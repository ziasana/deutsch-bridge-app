"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
    WritingExampleData,
    WritingFormatData,
    WritingLearningResponse,
    WritingMistakeData,
    WritingSentencePatternData,
    WritingStrategyData,
    WritingStructureData,
} from "@/types/writing";
import { cn } from "@/lib/utils";
import WritingFormat from "./WritingFormat";
import WritingStrategy from "./WritingStrategy";
import WritingStructure from "./WritingStructure";
import WritingExample from "./WritingExample";
import WritingPhraseList from "./WritingPhraseList";
import WritingSentencePatterns from "./WritingSentencePatterns";
import WritingCommonMistakes from "./WritingCommonMistakes";
import WritingChecklist from "./WritingChecklist";
import { LEARN_SECTIONS, LearnSectionId, itemsOfKind, sectionAvailability } from "./writingMeta";

interface WritingLearnProps {
    level: string;
    data: WritingLearningResponse;
}

export default function WritingLearn({ level, data }: WritingLearnProps) {
    const available = sectionAvailability(data);
    const sections = LEARN_SECTIONS.filter((s) => available[s.id]);
    const [openId, setOpenId] = useState<LearnSectionId | null>(sections[0]?.id ?? null);

    const open = (id: LearnSectionId) => {
        setOpenId(id);
        // Wait for the section to render open before scrolling to it.
        requestAnimationFrame(() => document.getElementById(`writing-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };

    const body: Record<LearnSectionId, () => ReactNode> = {
        format: () => <WritingFormat items={itemsOfKind<WritingFormatData>(data, "FORMAT")} />,
        strategie: () => <WritingStrategy items={itemsOfKind<WritingStrategyData>(data, "STRATEGY_STEP")} />,
        aufbau: () => <WritingStructure items={itemsOfKind<WritingStructureData>(data, "STRUCTURE_PART")} />,
        beispiele: () => <WritingExample items={itemsOfKind<WritingExampleData>(data, "EXAMPLE")} />,
        redemittel: () => <WritingPhraseList phrases={data.phrases} />,
        satzbausteine: () => <WritingSentencePatterns items={itemsOfKind<WritingSentencePatternData>(data, "SENTENCE_PATTERN")} />,
        fehler: () => <WritingCommonMistakes items={itemsOfKind<WritingMistakeData>(data, "MISTAKE")} />,
        checkliste: () => <WritingChecklist level={level} items={itemsOfKind(data, "CHECKLIST_ITEM")} />,
    };

    if (sections.length === 0) {
        return (
            <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">
                Für {level} sind noch keine Lerninhalte verfügbar.
            </div>
        );
    }

    return (
        <div>
            <nav aria-label="Lernbereiche" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => open(s.id)}
                        className={cn(
                            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                            openId === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/65 hover:bg-accent",
                        )}
                    >
                        {s.emoji} {s.label}
                    </button>
                ))}
            </nav>

            <div className="mt-4 space-y-3">
                {sections.map((s, i) => {
                    const isOpen = openId === s.id;
                    return (
                        <section key={s.id} id={`writing-${s.id}`} className="scroll-mt-24 rounded-[10px] bg-card shadow-card">
                            <h3>
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={`writing-panel-${s.id}`}
                                    onClick={() => setOpenId(isOpen ? null : s.id)}
                                    className="flex w-full items-center gap-3 p-4 text-left sm:p-5 cursor-pointer"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg">{s.emoji}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold text-foreground">
                                            {i + 1}. {s.label}
                                        </span>
                                        <span className="block text-sm font-normal text-foreground/55">{s.hint}</span>
                                    </span>
                                    <ChevronDown className={cn("size-5 shrink-0 text-foreground/40 transition-transform", isOpen && "rotate-180")} />
                                </button>
                            </h3>
                            {isOpen && (
                                <div id={`writing-panel-${s.id}`} className="border-t border-border/60 p-4 sm:p-5">
                                    {body[s.id]()}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
