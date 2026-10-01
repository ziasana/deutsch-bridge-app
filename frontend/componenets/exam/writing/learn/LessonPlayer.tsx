"use client";

import { useState } from "react";
import { LEARN_SECTIONS, LearnSectionId } from "../writingMeta";
import Celebration from "./Celebration";
import LessonShell, { LessonResult } from "./LessonShell";
import { Station } from "./types";

interface LessonPlayerProps {
    station: Station;
    nextStationId: LearnSectionId | null;
    onFinished: (id: LearnSectionId, result: LessonResult) => void;
    onNext: (id: LearnSectionId | null) => void;
    onExit: () => void;
}

/** Runs one station, then shows the end-of-lesson reaction. "Noch einmal" restarts the lesson from the first step. */
export default function LessonPlayer({ station, nextStationId, onFinished, onNext, onExit }: LessonPlayerProps) {
    const meta = LEARN_SECTIONS.find((s) => s.id === station.id)!;
    const nextMeta = nextStationId ? LEARN_SECTIONS.find((s) => s.id === nextStationId)! : null;
    const [result, setResult] = useState<LessonResult | null>(null);
    const [run, setRun] = useState(0);

    if (result) {
        return (
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
            />
        );
    }

    return (
        <LessonShell
            key={run}
            emoji={meta.emoji}
            title={meta.label}
            steps={station.steps}
            onExit={onExit}
            onFinish={(r) => {
                onFinished(station.id, r);
                setResult(r);
            }}
        />
    );
}
