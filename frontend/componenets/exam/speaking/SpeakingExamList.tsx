"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { ExamExerciseLastTime } from "@/types/examTime";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";
import { ExamPartGroup } from "../examData";
import { lessonThemeVars } from "../lessonTheme";
import ExamTimeTile from "../ExamTimeTile";
import SpeakingExerciseRow, { TEIL_EMOJI } from "./SpeakingExerciseRow";
import { learnHref, partOfTaskType, SPEAKING_PARTS } from "./speakingMeta";

interface SpeakingExamListProps {
    groups: ExamPartGroup[];
    level: string;
    lastTimes?: Record<string, ExamExerciseLastTime>;
}

/** The Mündlicher-Ausdruck Übungen of a level, one section per Teil: title with progress, Zeit-Check + Lernbereich tiles and one row per Übung. */
export default function SpeakingExamList({ groups, level, lastTimes }: Readonly<SpeakingExamListProps>) {
    const router = useRouter();
    const { toggle, pendingId } = useExamBookmark();
    const open = (id: string) => router.push(`/dashboard/exam-prep/exercise?id=${id}`);

    return (
        <div className="space-y-8" style={lessonThemeVars("speaking")}>
            {groups.map((group) => {
                const teil = group.items[0]?.teil ?? partOfTaskType((group.items[0]?.taskType as never) ?? "TOPIC_INTERVIEW");
                const meta = SPEAKING_PARTS.find((p) => p.part === teil);
                return (
                    <section key={group.key} aria-label={`Teil ${teil}`} className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-xl text-white shadow-md" aria-hidden="true">
                                {TEIL_EMOJI[teil] ?? "🎤"}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-foreground">Teil {teil}{meta ? ` · ${meta.title}` : ""}</h2>
                                <p className="text-xs text-foreground/55">{group.mastered} von {group.total} {group.total === 1 ? "Übung" : "Übungen"} erledigt</p>
                            </div>
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label={`Teil ${teil} Fortschritt`} aria-valuemin={0} aria-valuemax={group.total} aria-valuenow={group.mastered}>
                                <div className="h-full rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) transition-all duration-500" style={{ width: `${group.total === 0 ? 0 : (group.mastered / group.total) * 100}%` }} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 md:[&>*:only-child]:col-span-2">
                            <ExamTimeTile section="MUENDLICHER_AUSDRUCK" level={level} teil={teil} showLastResult={false} />
                            <Link
                                href={learnHref(level, teil)}
                                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-(--lesson-from)/10 via-card to-(--lesson-to)/10 p-4 shadow-card ring-1 ring-primary/20 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:p-5"
                            >
                                <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 -end-6 text-7xl opacity-10 transition group-hover:rotate-6 group-hover:opacity-20">📖</span>
                                <span className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-white shadow-md transition group-hover:scale-105">
                                    <BookOpen className="size-8" aria-hidden="true" />
                                </span>
                                <span className="relative min-w-0 flex-1">
                                    <span className="block text-base font-bold text-foreground">Erst lernen, dann sprechen</span>
                                    <span className="block text-sm text-foreground/65">Ablauf, Tipps und Redemittel für Teil {teil}</span>
                                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary transition-all group-hover:gap-2">
                                        Zum Lernbereich <ChevronRight className="size-3.5" aria-hidden="true" />
                                    </span>
                                </span>
                            </Link>
                        </div>

                        <ul className="space-y-3">
                            {group.items.map((item, index) => (
                                <SpeakingExerciseRow key={item.id} item={item} teil={teil} index={index} time={lastTimes?.[item.id]} bookmarkPending={pendingId === item.id} onOpen={open} onToggleBookmark={toggle} />
                            ))}
                        </ul>
                    </section>
                );
            })}
            {groups.length === 0 && <p className="py-8 text-center text-sm text-foreground/50">Noch keine Übungen verfügbar.</p>}
        </div>
    );
}
