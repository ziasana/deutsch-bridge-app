/** One colour per item, so a heading/ad visibly "belongs" to its text/situation. Static class names so Tailwind keeps them. */
export const READING_COLORS = [
    { solid: "bg-sky-500", soft: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-500" },
    { solid: "bg-violet-500", soft: "bg-violet-500/10", border: "border-violet-500/40", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500" },
    { solid: "bg-amber-500", soft: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500" },
    { solid: "bg-rose-500", soft: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-500" },
    { solid: "bg-emerald-500", soft: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500" },
    { solid: "bg-orange-500", soft: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500" },
    { solid: "bg-cyan-500", soft: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-700 dark:text-cyan-300", ring: "ring-cyan-500" },
    { solid: "bg-fuchsia-500", soft: "bg-fuchsia-500/10", border: "border-fuchsia-500/40", text: "text-fuchsia-700 dark:text-fuchsia-300", ring: "ring-fuchsia-500" },
    { solid: "bg-lime-600", soft: "bg-lime-600/10", border: "border-lime-600/40", text: "text-lime-700 dark:text-lime-300", ring: "ring-lime-600" },
    { solid: "bg-indigo-500", soft: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-500" },
];
export const readingColorAt = (i: number) => READING_COLORS[i % READING_COLORS.length];
export type ReadingColor = (typeof READING_COLORS)[number];
