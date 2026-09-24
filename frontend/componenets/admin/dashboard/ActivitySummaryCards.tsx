import { Activity, CalendarDays, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/componenets/ui/card";
import type { LearnerActivity } from "@/types/adminAnalytics";

const ITEMS: Array<{ key: keyof LearnerActivity; title: string; icon: typeof Users }> = [
    { key: "dailyActiveLearners", title: "Daily Active Learners", icon: Users },
    { key: "weeklyActiveLearners", title: "Weekly Active Learners", icon: CalendarDays },
    { key: "monthlyActiveLearners", title: "Monthly Active Learners", icon: Zap },
    { key: "totalActivities", title: "Learning Activities", icon: Activity },
];

export default function ActivitySummaryCards({ data }: Readonly<{ data: LearnerActivity }>) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map(({ key, title, icon: Icon }) => (
                <Card key={key}>
                    <CardContent className="flex items-center gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                            <Icon className="size-5 text-accent-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{data[key].toLocaleString()}</p>
                            <span className="text-sm text-foreground/60">{title}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
