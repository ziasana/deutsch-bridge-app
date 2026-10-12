import { BookOpen, Headphones, Mic, PenLine, Puzzle, type LucideIcon } from "lucide-react";
import type { ExamSection } from "@/types/exam";

/** One colour and icon per exam section, the same identity the lesson pages use (static class names so Tailwind keeps them). */
export interface SectionStyle {
    icon: LucideIcon;
    /** Solid fill for bars and icon tiles. */
    solid: string;
    soft: string;
    text: string;
    ring: string;
    border: string;
    /** Hex, for SVG. */
    hex: string;
}

export const SECTION_STYLE: Record<ExamSection, SectionStyle> = {
    LESEVERSTEHEN: { icon: BookOpen, solid: "bg-teal-500", soft: "bg-teal-500/10", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-500", border: "border-teal-500/40", hex: "#14b8a6" },
    SPRACHBAUSTEINE: { icon: Puzzle, solid: "bg-violet-500", soft: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500", border: "border-violet-500/40", hex: "#8b5cf6" },
    HOERVERSTEHEN: { icon: Headphones, solid: "bg-emerald-500", soft: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500", border: "border-emerald-500/40", hex: "#10b981" },
    SCHRIFTLICHER_AUSDRUCK: { icon: PenLine, solid: "bg-orange-500", soft: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500", border: "border-orange-500/40", hex: "#f97316" },
    MUENDLICHER_AUSDRUCK: { icon: Mic, solid: "bg-pink-500", soft: "bg-pink-500/10", text: "text-pink-700 dark:text-pink-300", ring: "ring-pink-500", border: "border-pink-500/40", hex: "#ec4899" },
    TESTFORMAT_INFORMATION: { icon: BookOpen, solid: "bg-slate-500", soft: "bg-slate-500/10", text: "text-slate-700 dark:text-slate-300", ring: "ring-slate-500", border: "border-slate-500/40", hex: "#64748b" },
};
