import { BookOpen, Headphones, LucideIcon, Mic, PenLine, Puzzle } from "lucide-react";

export interface SkillMeta {
    icon: LucideIcon;
    /** Same hues as the in-app exam sections, so the site previews what the app looks like. */
    color: string;
}

export const SKILL_META: Record<string, SkillMeta> = {
    lesen: { icon: BookOpen, color: "#4f9d96" },
    sprachbausteine: { icon: Puzzle, color: "#7a6a9e" },
    hoeren: { icon: Headphones, color: "#35618f" },
    schreiben: { icon: PenLine, color: "#c2674f" },
    sprechen: { icon: Mic, color: "#b5637f" },
};

export const skillMeta = (skill: string): SkillMeta => SKILL_META[skill] ?? SKILL_META.lesen;
