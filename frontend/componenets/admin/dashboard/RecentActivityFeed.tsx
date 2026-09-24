import Link from "next/link";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import type { RecentActivity } from "@/types/adminDashboard";

function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function FeedRow({ item }: Readonly<{ item: RecentActivity }>) {
    const body = (
        <div className="flex items-start gap-3 py-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{item.title}</p>
                {item.description && <p className="text-xs text-foreground/50 truncate">{item.description}</p>}
                <p className="text-xs text-foreground/40 mt-0.5">{relativeTime(item.createdAt)}</p>
            </div>
        </div>
    );

    if (!item.href) return body;
    return (
        <Link href={item.href} className="block rounded-lg px-2 -mx-2 hover:bg-accent/40 transition-colors">
            {body}
        </Link>
    );
}

export default function RecentActivityFeed({ items }: Readonly<{ items: RecentActivity[] }>) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="size-4 text-foreground/60" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-foreground/50">No recent activity.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((item) => (
                            <li key={item.id}>
                                <FeedRow item={item} />
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
