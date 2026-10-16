import { BookOpen, Headphones, LucideIcon, Mic, PenLine, Puzzle } from "lucide-react";

export interface SkillMeta {
    icon: LucideIcon;
    /** Same hues as the in-app exam sections, so the site previews what the app looks like. */
    color: string;
}

export const SKILL_META: Record<string, SkillMeta> = {
    lesen: { icon: BookOpen, color: "#0d9488" },
    sprachbausteine: { icon: Puzzle, color: "#7c3aed" },
    hoeren: { icon: Headphones, color: "#059669" },
    schreiben: { icon: PenLine, color: "#f97316" },
    sprechen: { icon: Mic, color: "#ec4899" },
};

export const skillMeta = (skill: string): SkillMeta => SKILL_META[skill] ?? SKILL_META.lesen;
