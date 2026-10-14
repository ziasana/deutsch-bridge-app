"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Mic } from "lucide-react";
import { DTZ_ORAL_PARTS } from "@/types/dtzOral";
import { ExamPartGroup } from "../examData";

/** The DTZ Mündliche Prüfung Übungen of the learner, one section per Teil (Teil 1 fixed template, Teil 2 photo, Teil 3 planning). */
export default function DtzOralList({ groups: allGroups, onlyPart }: Readonly<{ groups: ExamPartGroup[]; /** Show just this Teil (arriving from the learning area). */ onlyPart?: string | null }>) {
    const router = useRouter();
    const groups = onlyPart ? allGroups.filter((g) => g.key === onlyPart) : allGroups;
    return (
        <div className="space-y-8">
            {groups.map((group) => {
                const meta = DTZ_ORAL_PARTS.find((p) => String(p.part) === group.key);
                return (
                    <section key={group.key} aria-label={`Teil ${group.key}`} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md" aria-hidden="true"><Mic className="size-5" /></span>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-foreground">Teil {group.key}{meta ? ` · ${meta.title}` : ""}</h2>
                                <p className="text-xs text-foreground/55">{group.mastered} von {group.total} {group.total === 1 ? "Übung" : "Übungen"} geübt</p>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {group.items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/dashboard/exam-prep/exercise?id=${item.id}`)}
                                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-card px-5 py-4 text-start shadow-card ring-1 ring-foreground/10 transition hover:-translate-y-0.5 hover:ring-primary/40"
                                    >
                                        <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">{item.title}</span>
                                        {item.completed && <CheckCircle2 className="size-5 text-green-600" aria-label="Geübt" />}
                                        <ChevronRight className="size-4 text-foreground/40" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
            {groups.length === 0 && <p className="py-8 text-center text-sm text-foreground/50">Noch keine Übungen verfügbar.</p>}
        </div>
    );
}
