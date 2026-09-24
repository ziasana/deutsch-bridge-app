import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import type { LearningActivityItem } from "@/types/adminDashboard";

export default function LearningActivity({ items }: Readonly<{ items: LearningActivityItem[] }>) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const hasActivity = items.some((i) => i.value > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="size-4 text-foreground/60" />
                    Learning Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {hasActivity ? (
                    <ul className="space-y-3">
                        {items.map((item) => (
                            <li key={item.key}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-foreground/70">{item.label}</span>
                                    <span className="font-medium text-foreground tabular-nums">{item.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-6 text-center text-sm text-foreground/50">No activity data available yet.</p>
                )}
                <p className="mt-4 text-xs text-foreground/40">Learning sessions over the last 7 days.</p>
            </CardContent>
        </Card>
    );
}
