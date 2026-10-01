import { WritingLearningResponse } from "@/types/writing";
import { LEARN_SECTIONS, LearnSectionId } from "../../writingMeta";
import { Station } from "../types";
import { checklistSteps } from "./checklist";
import { exampleSteps } from "./examples";
import { formatSteps } from "./format";
import { mistakeSteps } from "./mistakes";
import { patternSteps } from "./patterns";
import { phraseSteps } from "./phrases";
import { strategySteps } from "./strategy";
import { structureSteps } from "./structure";

/** Builds the lesson steps for every station that has content for the level, in learning order. Pure and deterministic. */
export function buildStations(data: WritingLearningResponse, level: string): Station[] {
    const seed = (id: LearnSectionId) => `${level}-${id}`;
    const byId: Record<LearnSectionId, Station["steps"]> = {
        format: formatSteps(data),
        strategie: strategySteps(data, seed("strategie")),
        aufbau: structureSteps(data, seed("aufbau")),
        beispiele: exampleSteps(data, seed("beispiele")),
        redemittel: phraseSteps(data, seed("redemittel")),
        satzbausteine: patternSteps(data, seed("satzbausteine")),
        fehler: mistakeSteps(data, seed("fehler")),
        checkliste: checklistSteps(data),
    };
    return LEARN_SECTIONS.filter((s) => byId[s.id].length > 0).map((s) => ({ id: s.id, steps: byId[s.id] }));
}
