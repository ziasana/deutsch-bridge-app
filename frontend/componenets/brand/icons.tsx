import { forwardRef } from "react";
import { createLucideIcon, type LucideIcon, type LucideProps } from "lucide-react";

/**
 * DeutschCertify icon set: 24px grid, outlined, round caps and joins. Built with createLucideIcon so they are
 * drop-in replacements for Lucide icons (size, className, colour via currentColor) and default to the brand's
 * 1.75px stroke. The same drawings live in brand/icons as SVG.
 */
function brandIcon(name: string, node: Parameters<typeof createLucideIcon>[1]): LucideIcon {
    const Base = createLucideIcon(name, node);
    const Branded = forwardRef<SVGSVGElement, LucideProps>((props, ref) => <Base ref={ref} strokeWidth={1.75} {...props} />);
    Branded.displayName = name;
    return Branded as unknown as LucideIcon;
}

export const ExamIcon = brandIcon("brand-exam", [
    ["path", { d: "M6 3h9l4 4v14H6z", key: "a" }],
    ["path", { d: "M9 14l2 2 4-4", key: "b" }],
]);
export const VocabularyIcon = brandIcon("brand-vocabulary", [["path", { d: "M4 5h16v11H10l-4 4v-4H4z", key: "a" }]]);
export const GrammarIcon = brandIcon("brand-grammar", [
    ["path", { d: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z", key: "a" }],
    ["path", { d: "M5 17a3 3 0 0 1 3-3h11", key: "b" }],
]);
export const ListeningIcon = brandIcon("brand-listening", [
    ["path", { d: "M4 13a8 8 0 0 1 16 0", key: "a" }],
    ["path", { d: "M4 13v4a2 2 0 0 0 2 2h1v-6zM20 13v4a2 2 0 0 1-2 2h-1v-6z", key: "b" }],
]);
export const ReadingIcon = brandIcon("brand-reading", [
    ["path", { d: "M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14", key: "a" }],
]);
export const WritingIcon = brandIcon("brand-writing", [
    ["path", { d: "M4 20l1-4L16 5l3 3L8 19z", key: "a" }],
    ["path", { d: "M14 7l3 3", key: "b" }],
]);
export const SpeakingIcon = brandIcon("brand-speaking", [
    ["rect", { x: "9", y: "3", width: "6", height: "11", rx: "3", key: "a" }],
    ["path", { d: "M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6", key: "b" }],
]);
export const CertificateIcon = brandIcon("brand-certificate", [
    ["circle", { cx: "12", cy: "9", r: "5", key: "a" }],
    ["path", { d: "M9 13.5L8 21l4-2 4 2-1-7.5M10 9l1.5 1.5L14 8", key: "b" }],
]);
export const StreakIcon = brandIcon("brand-streak", [
    ["path", { d: "M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z", key: "a" }],
]);
export const ProgressIcon = brandIcon("brand-progress", [["path", { d: "M6 20v-6M12 20V9M18 20V4", key: "a" }]]);
export const TimerIcon = brandIcon("brand-timer", [
    ["circle", { cx: "12", cy: "13", r: "8", key: "a" }],
    ["path", { d: "M12 9v4l3 2M10 2h4", key: "b" }],
]);
