"use client";

import { Mic } from "lucide-react";
import { ExamExercisePublicResponse } from "@/types/exam";
import ExerciseTopHeader from "../ExerciseTopHeader";
import { SPEAKING_PARTS } from "./speakingMeta";

export { instructionSteps } from "../ExerciseTopHeader";

/** "B1 Mündlicher Ausdruck Teil 1 – Sich kennenlernen: Ana" -> "Sich kennenlernen: Ana" (level, section and Teil are shown as chips). */
export const shortSpeakingTitle = (title: string) => title.replace(/^.*?Mündlicher Ausdruck\s+Teil\s+\d\s*[–-]\s*/i, "").trim() || title;

interface SpeakingTopHeaderProps {
    exercise: ExamExercisePublicResponse;
    bookmarked: boolean;
    bookmarkPending: boolean;
    onToggleBookmark: () => void;
}

export default function SpeakingTopHeader({ exercise, ...rest }: Readonly<SpeakingTopHeaderProps>) {
    const part = SPEAKING_PARTS.find((p) => p.part === exercise.teil);
    return (
        <ExerciseTopHeader
            exercise={exercise}
            accent="speaking"
            icon={Mic}
            kicker={`Teil ${exercise.teil}${part ? ` · ${part.title}` : ""}`}
            sectionLabel="Mündlicher Ausdruck"
            title={shortSpeakingTitle(exercise.title)}
            {...rest}
        />
    );
}
