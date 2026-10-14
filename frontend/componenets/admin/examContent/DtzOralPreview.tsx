"use client";

import DtzOralExercise from "@/componenets/exam/dtzOral/DtzOralExercise";
import { DtzOralTeil2 } from "@/types/dtzOral";
import { ExercisePreviewData, PreviewDtzOral } from "@/types/examContent";

/**
 * DTZ Mündliche Prüfung as the learner sees it (the same components), plus the admin-only image prompt of Teil 2.
 * The preview of a Teil 2 exercise without an uploaded photo shows the empty photo frame, which is also what blocks publishing.
 */
export default function DtzOralPreview({ preview, oral }: Readonly<{ preview: ExercisePreviewData; oral: PreviewDtzOral }>) {
    const imagePrompt = oral.content.part === 2 ? (oral.content as DtzOralTeil2).image?.imagePrompt ?? null : null;
    return (
        <div className="rounded-xl bg-background p-4 text-foreground">
            <DtzOralExercise title={preview.title ?? ""} content={oral.content} adminImagePrompt={imagePrompt} />
        </div>
    );
}
