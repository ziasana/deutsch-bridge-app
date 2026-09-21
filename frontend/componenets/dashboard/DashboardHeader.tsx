"use client";

import { Flame } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { getLevelMeta } from "@/componenets/learning/levelMeta";

interface DashboardHeaderProps {
    displayName: string;
    level: string;
    streak: number;
}

export default function DashboardHeader({ displayName, level, streak }: DashboardHeaderProps) {
    const { t } = useI18n();
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? t.dashboard.greeting.morning(displayName)
            : hour < 18 ? t.dashboard.greeting.afternoon(displayName)
                : t.dashboard.greeting.evening(displayName);

    const levelMeta = getLevelMeta(level);
    const LevelIcon = levelMeta.icon;

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{greeting}</h1>
            <p className="text-foreground/60 mt-1">{t.dashboard.greeting.subtitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                {streak > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {t.dashboard.greeting.streakDays(streak)}
                    </span>
                )}
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                    style={{ backgroundColor: `${levelMeta.color}1a`, color: levelMeta.color }}
                >
                    <LevelIcon className="h-4 w-4" />
                    {level}
                </span>
            </div>
        </div>
    );
}
