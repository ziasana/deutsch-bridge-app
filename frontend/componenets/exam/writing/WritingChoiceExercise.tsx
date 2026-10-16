"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, PenLine } from "lucide-react";
import { getWritingAttempts } from "@/services/writingAttemptService";
import { ExamExercisePublicResponse } from "@/types/exam";
import { lessonThemeVars } from "../lessonTheme";
import WritingChoiceTaskCard from "./WritingChoiceTaskCard";
import WritingExercise from "./WritingExercise";

const STANDARD_INSTRUCTIONS =
    "Wählen Sie Aufgabe A oder Aufgabe B. Zeigen Sie, was Sie können. Schreiben Sie möglichst viel. Vergessen Sie nicht die Anrede und den Gruß. " +
    "Schreiben Sie Ihren Text auf den Antwortbogen. Kreuzen Sie auf dem Antwortbogen an, welche Aufgabe Sie gewählt haben.";

const choiceKey = (exerciseId: string) => `writing-choice-${exerciseId}`;

function loadChoice(exerciseId: string): string | null {
    try {
        return localStorage.getItem(choiceKey(exerciseId));
    } catch {
        return null;
    }
}

interface WritingChoiceExerciseProps {
    exercise: ExamExercisePublicResponse;
    /** Called after a successful submission (the page marks the exercise done / stops its timer). */
    onSubmitted: () => void;
}

/**
 * DTZ Schreiben: the learner sees the writing time and the standard instructions, two separate alternatives (Aufgabe A and B),
 * chooses exactly one and writes in the editor below. The choice is remembered per exercise (and taken from the latest submitted
 * text on another device); drafts are kept per alternative, and a submission carries the alternative it answers.
 */
export default function WritingChoiceExercise({ exercise, onSubmitted }: Readonly<WritingChoiceExerciseProps>) {
    const choice = exercise.writingChoice;
    const labels = (choice?.tasks ?? []).map((t) => t.taskLabel as string);
    const [stored] = useState(() => loadChoice(exercise.id));
    const [selected, setSelected] = useState<string | null>(stored && labels.includes(stored) ? stored : null);

    // On a device without a remembered choice, continue with the alternative of the latest submitted text.
    const { data: attempts = [] } = useQuery({
        queryKey: ["writing", "attempts", exercise.id],
        queryFn: () => getWritingAttempts(exercise.id).then((res) => res.data),
    });
    useEffect(() => {
        if (selected) return;
        const last = [...attempts].reverse().find((a) => a.selectedTask && labels.includes(a.selectedTask));
        if (last?.selectedTask) setSelected(last.selectedTask);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempts, selected]);

    const choose = (label: string) => {
        setSelected(label);
        try {
            localStorage.setItem(choiceKey(exercise.id), label);
        } catch {
            /* storage unavailable - the choice just isn't remembered */
        }
    };

    if (!choice || choice.tasks.length === 0) {
        return <div className="rounded-[10px] bg-card p-6 text-sm text-foreground/60 shadow-card">Diese Übung hat noch keinen Inhalt.</div>;
    }
    const task = choice.tasks.find((t) => t.taskLabel === selected) ?? null;

    return (
        <div className="space-y-5" style={lessonThemeVars("writing")}>
            <section aria-label="Prüfungshinweise" className="space-y-3 rounded-3xl bg-card p-5 shadow-card ring-1 ring-primary/15">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><PenLine className="size-5" aria-hidden="true" /></span>
                    <h2 className="text-lg font-extrabold text-foreground">Schreiben</h2>
                    <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        <Clock className="size-4" aria-hidden="true" />
                        {choice.durationMinutes} Minuten
                    </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{exercise.teilDescription || STANDARD_INSTRUCTIONS}</p>
            </section>

            <fieldset className="space-y-3 border-0 p-0">
                <legend className="mb-2 text-sm font-bold text-foreground">Welche Aufgabe wählen Sie?</legend>
                <div className="grid gap-4 lg:grid-cols-2">
                    {choice.tasks.map((t) => (
                        <WritingChoiceTaskCard
                            key={t.taskLabel}
                            task={t}
                            groupName={`writing-task-${exercise.id}`}
                            selected={selected === t.taskLabel}
                            onSelect={() => choose(t.taskLabel)}
                        />
                    ))}
                </div>
            </fieldset>

            {task ? (
                <div className="space-y-2">
                    <p role="status" className="text-sm font-semibold text-foreground/70">Sie schreiben zu Aufgabe {task.taskLabel}: {task.title}</p>
                    <WritingExercise
                        key={task.taskLabel}
                        exerciseId={exercise.id}
                        draftKey={`${exercise.id}-${task.taskLabel}`}
                        selectedTask={task.taskLabel}
                        level={exercise.level}
                        requiresPlanning={exercise.requiresPlanning}
                        leitpunkte={task.points.map((p) => p.text)}
                        modelSolution={null}
                        onSubmitted={onSubmitted}
                    />
                </div>
            ) : (
                <p role="status" className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-foreground/70">
                    Wählen Sie Aufgabe A oder Aufgabe B, um mit dem Schreiben zu beginnen.
                </p>
            )}
        </div>
    );
}
