import Link from "next/link";
import { AlertTriangle, ChevronRight, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import type { AttentionItem, AttentionPriority } from "@/types/adminDashboard";

const PRIORITY_DOT: Record<AttentionPriority, string> = {
    high: "bg-destructive",
    medium: "bg-amber-500",
    low: "bg-foreground/30",
};

export default function NeedsAttention({ items }: Readonly<{ items: AttentionItem[] }>) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Needs attention
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-4 text-sm">
                        <CircleCheck className="size-5 shrink-0 text-emerald-600" />
                        <div>
                            <p className="font-medium text-foreground">Everything looks good</p>
                            <p className="text-foreground/60">There are no items that need your attention right now.</p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={item.href}
                                    className="flex items-center justify-between gap-3 py-3 hover:bg-accent/40 rounded-lg px-2 -mx-2 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={cn("size-2 rounded-full shrink-0", PRIORITY_DOT[item.priority])} />
                                        <span className="text-lg font-semibold text-foreground tabular-nums w-8 shrink-0">
                                            {item.count}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                            {item.description && (
                                                <p className="text-xs text-foreground/50 truncate">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 text-sm font-medium text-primary shrink-0">
                                        Review
                                        <ChevronRight className="size-4" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
