import {
    Bell,
    BookOpen,
    Brain,
    CreditCard,
    GraduationCap,
    LayoutDashboard,
    Layers,
    MessageSquare,
    Newspaper,
    Settings,
    Sparkles,
    SpellCheck,
    TrendingUp,
    User,
} from "lucide-react";
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
        { href: "/dashboard/grammar", label: t.dashboard.modules.grammarLessons.title, icon: BookOpen },
        { href: "/dashboard/expressions", label: t.dashboard.modules.expressions.title, icon: Sparkles },
        { href: "/dashboard/reading", label: t.dashboard.modules.reading.title, icon: Newspaper },
        { href: "/dashboard/exam-prep", label: t.dashboard.modules.examPrep.title, icon: GraduationCap },
        { href: "/dashboard/reading/review", label: t.dashboard.modules.wordReview.title, icon: Brain },
        { href: "/dashboard/vocabulary", label: t.dashboard.modules.vocabularyTrainer.title, icon: Layers },
        { href: "/dashboard/chat", label: t.dashboard.modules.aiChat.title, icon: MessageSquare },
        { href: "/user-progress", label: t.nav.yourProgress, icon: TrendingUp },
        { href: "/profile", label: t.nav.profile, icon: User },
    ];
}

export function getAdminNavItems(t: Dictionary): NavItem[] {
    return [
        { href: "/admin", label: t.nav.adminDashboard, icon: LayoutDashboard },
        { href: "/admin/reading", label: t.nav.manageReading, icon: Newspaper },
        { href: "/admin/exam-prep", label: t.nav.manageExamPrep, icon: GraduationCap },
        { href: "/admin/grammar", label: t.nav.manageGrammar, icon: BookOpen },
        { href: "/admin/expressionsSection", label: t.nav.manageExpressions, icon: Sparkles },
        {
            label: t.nav.settings,
            icon: Settings,
            children: [
                { href: "/admin/notifications", label: t.nav.manageNotifications, icon: Bell },
                { href: "/admin/settings", label: t.nav.monetization, icon: CreditCard },
            ],
        },
        { href: "/profile", label: t.nav.profile, icon: User },
    ];
}
