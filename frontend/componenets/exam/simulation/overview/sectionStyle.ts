import { Puzzle, type LucideIcon } from "lucide-react";
import { ListeningIcon, ReadingIcon, SpeakingIcon, WritingIcon } from "@/componenets/brand/icons";
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
    LESEVERSTEHEN: { icon: ReadingIcon, solid: "bg-exam-lesen", soft: "bg-exam-lesen/10", text: "text-[color-mix(in_srgb,var(--exam-lesen)_70%,black)] dark:text-[color-mix(in_srgb,var(--exam-lesen)_55%,white)]", ring: "ring-exam-lesen", border: "border-exam-lesen/40", hex: "#16324f" },
    SPRACHBAUSTEINE: { icon: Puzzle, solid: "bg-exam-sprachbausteine", soft: "bg-exam-sprachbausteine/10", text: "text-[color-mix(in_srgb,var(--exam-sprachbausteine)_70%,black)] dark:text-[color-mix(in_srgb,var(--exam-sprachbausteine)_55%,white)]", ring: "ring-exam-sprachbausteine", border: "border-exam-sprachbausteine/40", hex: "#7a6a9e" },
    HOERVERSTEHEN: { icon: ListeningIcon, solid: "bg-exam-hoeren", soft: "bg-exam-hoeren/10", text: "text-[color-mix(in_srgb,var(--exam-hoeren)_70%,black)] dark:text-[color-mix(in_srgb,var(--exam-hoeren)_55%,white)]", ring: "ring-exam-hoeren", border: "border-exam-hoeren/40", hex: "#35618f" },
    SCHRIFTLICHER_AUSDRUCK: { icon: WritingIcon, solid: "bg-exam-schreiben", soft: "bg-exam-schreiben/10", text: "text-[color-mix(in_srgb,var(--exam-schreiben)_70%,black)] dark:text-[color-mix(in_srgb,var(--exam-schreiben)_55%,white)]", ring: "ring-exam-schreiben", border: "border-exam-schreiben/40", hex: "#c2674f" },
    MUENDLICHER_AUSDRUCK: { icon: SpeakingIcon, solid: "bg-exam-muendlich", soft: "bg-exam-muendlich/10", text: "text-[color-mix(in_srgb,var(--exam-muendlich)_70%,black)] dark:text-[color-mix(in_srgb,var(--exam-muendlich)_55%,white)]", ring: "ring-exam-muendlich", border: "border-exam-muendlich/40", hex: "#b5637f" },
    TESTFORMAT_INFORMATION: { icon: ReadingIcon, solid: "bg-slate-500", soft: "bg-slate-500/10", text: "text-slate-700 dark:text-slate-300", ring: "ring-slate-500", border: "border-slate-500/40", hex: "#64748b" },
};
