import { Bell, Blocks, ClipboardCheck, FileUp, Brain, CreditCard, Info, LayoutDashboard, Mail, MessageSquare, MessagesSquare, PenSquare, Settings, Sparkles, SpellCheck, WandSparkles, User, Users } from "lucide-react";
import { ExamIcon, GrammarIcon, ListeningIcon, ProgressIcon, ReadingIcon, SpeakingIcon, TimerIcon, VocabularyIcon, WritingIcon } from "@/componenets/brand/icons";
import type { Dictionary } from "@/lib/i18n/translations";

export interface NavItem {
    /** Omitted on a parent item that only expands to reveal `children`. */
    href?: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    /** Sub-links shown when this item is expanded, instead of navigating anywhere itself. */
    children?: NavItem[];
}

export function getUserNavItems(t: Dictionary): NavItem[] {
    return [
        { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
        { href: "/dashboard/daily-words", label: t.dashboard.modules.dailyWords.title, icon: SpellCheck },
        { href: "/dashboard/vocabulary", label: t.nav.sidebarVocabulary, icon: VocabularyIcon },
        { href: "/dashboard/expressions", label: t.dashboard.modules.expressions.title, icon: Sparkles },
        { href: "/dashboard/redemittel", label: "Redemittel", icon: MessagesSquare },
        { href: "/dashboard/grammar", label: t.dashboard.modules.grammarLessons.title, icon: GrammarIcon },
        { href: "/dashboard/reading", label: t.dashboard.modules.reading.title, icon: ReadingIcon },
        { href: "/dashboard/exam-prep", label: t.nav.sidebarExamPrep, icon: ExamIcon },
        { href: "/dashboard/exam-prep/pruefung", label: "Probeprüfung", icon: TimerIcon },
        { href: "/dashboard/chat", label: t.nav.sidebarAiChat, icon: MessageSquare },
        { href: "/dashboard/reading/review", label: t.nav.sidebarWordReview, icon: Brain },
        { href: "/user-progress", label: t.nav.sidebarProgress, icon: ProgressIcon },
    ];
}

export function getAdminNavItems(t: Dictionary): NavItem[] {
    return [
        { href: "/admin", label: t.nav.dashboard, icon: LayoutDashboard },
        { href: "/admin/users", label: t.nav.manageUsers, icon: Users },
        { href: "/admin/reading", label: t.nav.manageReading, icon: ReadingIcon },
        { href: "/admin/blog", label: t.nav.manageBlog, icon: PenSquare },
        {
            label: t.nav.manageExamPrep,
            icon: ExamIcon,
            children: [
                { href: "/admin/exam-prep/leseverstehen", label: "Leseverstehen", icon: ReadingIcon },
                { href: "/admin/exam-prep/sprachbausteine", label: "Sprachbausteine", icon: Blocks },
                { href: "/admin/exam-prep/hoerverstehen", label: "Hörverstehen", icon: ListeningIcon },
                { href: "/admin/exam-prep/schriftlicher-ausdruck", label: "Schriftlicher Ausdruck", icon: WritingIcon },
                { href: "/admin/exam-prep/muendlicher-ausdruck", label: "Mündlicher Ausdruck", icon: SpeakingIcon },
                { href: "/admin/exam-prep/schreiben-inhalte", label: "Schreiben lernen", icon: WritingIcon },
                { href: "/admin/exam-prep/sprechen-lernen", label: "Sprechen lernen", icon: SpeakingIcon },
                { href: "/admin/exam-prep/testformat-information", label: "Testformat Information", icon: Info },
                { href: "/admin/exam-prep/content-generator", label: "Content Generator", icon: WandSparkles },
                { href: "/admin/exam-prep/import", label: "Import JSON", icon: FileUp },
                { href: "/admin/exam-prep/content-library", label: "Content Library", icon: ClipboardCheck },
                { href: "/admin/exam-prep/pruefungssimulation", label: "Prüfungssimulation", icon: TimerIcon },
            ],
        },
        { href: "/admin/grammar", label: t.nav.manageGrammar, icon: GrammarIcon },
        { href: "/admin/expressionsSection", label: t.nav.manageExpressions, icon: Sparkles },
        {
            label: t.nav.manageRedemittel,
            icon: MessagesSquare,
            children: [
                { href: "/admin/redemittel", label: "Redemittel", icon: MessagesSquare },
                { href: "/admin/redemittel/functions", label: "Funktionen", icon: VocabularyIcon },
            ],
        },
        {
            label: t.nav.settings,
            icon: Settings,
            children: [
                { href: "/admin/notifications", label: t.nav.manageNotifications, icon: Bell },
                { href: "/admin/settings", label: t.nav.monetization, icon: CreditCard },
                { href: "/admin/settings/email-test", label: "Email Testing", icon: Mail },
            ],
        },
        { href: "/profile", label: t.nav.profile, icon: User },
    ];
}
