import Link from "next/link";
import { BookOpen, Newspaper, Sparkles, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";

interface QuickAction {
    label: string;
    href: string;
    icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
    { label: "Manage Grammar", href: "/admin/grammar", icon: BookOpen },
    { label: "Manage Expressions", href: "/admin/expressionsSection", icon: Sparkles },
    { label: "Manage Reading", href: "/admin/reading", icon: Newspaper },
    { label: "Manage Users", href: "/admin/users", icon: Users },
];

export default function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {ACTIONS.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-center transition-colors hover:bg-accent/40"
                        >
                            <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
                                <Icon className="size-4 text-accent-foreground" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{label}</span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
