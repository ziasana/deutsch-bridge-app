/** Colour classes of a score chip: green from 70 %, amber from 50 %, red below. */
export const scoreTone = (score: number) =>
    score >= 70 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : score >= 50 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-red-500/15 text-red-700 dark:text-red-300";
