"use client";

import { useState } from "react";
import { LessonAccent, lessonThemeVars } from "../../lessonTheme";
import { LEARN_SECTIONS } from "../writingMeta";
import Celebration from "./Celebration";
import LessonShell, { LessonResult } from "./LessonShell";
import { LearnSectionMeta, Station } from "./types";

interface LessonPlayerProps {
    station: Station;
    nextStationId: string | null;
    onFinished: (id: string, result: LessonResult) => void;
    onNext: (id: string | null) => void;
    onExit: () => void;
    /** Display data of the path's stations; defaults to Schreiben's. */
    sections?: readonly LearnSectionMeta[];
    /** Text of the final button after the last station. */
    finishLabel?: string;
    /** Re-colours the whole lesson (shell, slides, games and the end screen) in the pink/orange theme. */
    accent?: LessonAccent;
}

/** Runs one station, then shows the end-of-lesson reaction. "Noch einmal" restarts the lesson from the first step. */
export default function LessonPlayer({ station, nextStationId, onFinished, onNext, onExit, sections = LEARN_SECTIONS, finishLabel, accent }: LessonPlayerProps) {
    const meta = sections.find((s) => s.id === station.id)!;
    const nextMeta = nextStationId ? (sections.find((s) => s.id === nextStationId) ?? null) : null;
    const [result, setResult] = useState<LessonResult | null>(null);
    const [run, setRun] = useState(0);

    // Every `primary` colour inside (progress, buttons, game states) follows this variable.
    const themed = (node: React.ReactNode) => (accent ? <div style={lessonThemeVars(accent)}>{node}</div> : node);

    if (result) {
        return themed(
            <Celebration
                correct={result.correct}
                total={result.total}
                stationLabel={meta.label}
                nextLabel={nextMeta?.label ?? null}
                onNext={() => onNext(nextStationId)}
                onRepeat={() => {
                    setResult(null);
                    setRun((r) => r + 1);
                }}
                onOverview={onExit}
                finishLabel={finishLabel}
                accent={accent}
            />,
        );
    }

    return themed(
        <LessonShell
            accent={accent}
            key={run}
            emoji={meta.emoji}
            title={meta.label}
            steps={station.steps}
            onExit={onExit}
            onFinish={(r) => {
                onFinished(station.id, r);
                setResult(r);
            }}
        />,
    );
}
