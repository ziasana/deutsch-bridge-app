import GrammarLessonSkeleton from "@/componenets/grammar/GrammarLessonSkeleton";

/** Shown by Next while a grammar route's code arrives (list, lesson, practice, category test) instead of a full-screen loader. */
export default function GrammarLoading() {
    return <GrammarLessonSkeleton />;
}
