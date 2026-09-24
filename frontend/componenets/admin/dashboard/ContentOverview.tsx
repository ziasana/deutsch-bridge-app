import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Newspaper, SpellCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import type { ContentOverview as ContentOverviewData } from "@/types/adminDashboard";

const ROWS: Array<{ key: keyof ContentOverviewData; label: string; icon: typeof BookOpen; href: string }> = [
    { key: "grammar", label: "Grammar", icon: BookOpen, href: "/admin/grammar" },
    { key: "expressions", label: "Expressions", icon: Sparkles, href: "/admin/expressionsSection" },
    { key: "reading", label: "Reading", icon: Newspaper, href: "/admin/reading" },
    { key: "examExercises", label: "Exam Exercises", icon: GraduationCap, href: "/admin/exam-prep" },
    { key: "dailyWords", label: "Daily Words", icon: SpellCheck, href: "/admin/reading" },
];

export default function ContentOverview({ data }: Readonly<{ data: ContentOverviewData }>) {
    const isEmpty = ROWS.every((row) => data[row.key] === 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Content Overview</CardTitle>
            </CardHeader>
            <CardContent>
                {isEmpty ? (
                    <p className="py-6 text-center text-sm text-foreground/50">No content yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {ROWS.map(({ key, label, icon: Icon, href }) => (
                            <li key={key}>
                                <Link
                                    href={href}
                                    className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 hover:bg-accent/40 transition-colors"
                                >
                                    <span className="flex items-center gap-2 text-sm text-foreground/80">
                                        <Icon className="size-4 text-foreground/50" />
                                        {label}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground tabular-nums">
                                        {data[key].toLocaleString()}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <Link
                    href="/admin/reading"
                    className="mt-4 flex items-center gap-1 text-sm font-medium text-primary"
                >
                    View all content
                    <ArrowRight className="size-3.5" />
                </Link>
            </CardContent>
        </Card>
    );
}
