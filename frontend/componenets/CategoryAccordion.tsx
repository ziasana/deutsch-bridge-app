"use client";

import { ReactNode } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Layers } from "lucide-react";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

interface CategoryAccordionCardProps {
    title: string;
    level?: string;
    itemCount: number;
    learnedCount?: number;
    collapsed: boolean;
    onToggle: () => void;
    footer?: ReactNode;
    headerExtra?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function CategoryAccordionCard({
    title,
    level,
    itemCount,
    learnedCount,
    collapsed,
    onToggle,
    footer,
    headerExtra,
    children,
    className,
}: CategoryAccordionCardProps) {
    const hasProgress = typeof learnedCount === "number" && itemCount > 0;
    const progressPct = hasProgress ? Math.round((learnedCount! / itemCount) * 100) : 0;
    const levelColor = level ? getLevelMeta(level).color : undefined;

    return (
        <div className={cn("rounded-[10px] bg-card shadow-card overflow-hidden", className)}>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={!collapsed}
                className="w-full flex items-center gap-4 flex-wrap sm:flex-nowrap p-4 text-left hover:bg-accent/40 transition-colors"
            >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Layers className="size-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                    <span className="text-lg font-semibold text-foreground truncate block">{title}</span>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-foreground/50">
                            {itemCount} topic{itemCount === 1 ? "" : "s"}
                        </span>
                        {headerExtra}
                    </div>
                </div>

                {hasProgress && (
                    <div className="w-full sm:w-44 shrink-0 text-right space-y-1.5 pl-[60px] sm:pl-0">
                        <span className="text-xs font-medium text-foreground/60">
                            {learnedCount}/{itemCount} completed
                        </span>
                        <LearningProgressBar value={progressPct} color={levelColor} ariaLabel={`${title} progress`} />
                    </div>
                )}

                <ChevronDown
                    className={cn(
                        "size-5 shrink-0 text-foreground/40 transition-transform duration-200",
                        !collapsed && "rotate-180",
                    )}
                />
            </button>

            {!collapsed && (
                <div className="px-4 pb-4 space-y-2 border-t border-border/60 pt-3">
                    {children}
                    {footer}
                </div>
            )}
        </div>
    );
}

interface ContentItemRowProps {
    title: string;
    description?: string;
    level?: string;
    learned?: boolean;
    actions?: ReactNode;
    onClick: () => void;
    dir?: "ltr" | "rtl";
    className?: string;
}

export function ContentItemRow({
    title,
    description,
    level,
    learned,
    actions,
    onClick,
    dir,
    className,
}: ContentItemRowProps) {
    const levelColor = level ? getLevelMeta(level).color : undefined;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClick();
            }}
            dir={dir}
            className={cn(
                "w-full flex items-center gap-3 rounded-lg p-3.5 transition-colors cursor-pointer group",
                learned
                    ? "bg-emerald-50/70 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                    : "bg-background/60 dark:bg-white/5 hover:bg-accent/50",
                dir === "rtl" ? "text-right" : "text-left",
                className,
            )}
        >
            {learned === undefined ? null : learned ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle2 className="size-4 text-white" strokeWidth={2.5} />
                </span>
            ) : (
                <Circle className="size-6 shrink-0 text-foreground/25" />
            )}

            <div className="min-w-0 flex-1">
                <span className="font-medium text-foreground truncate block group-hover:text-primary transition-colors">
                    {title}
                </span>
                {description && (
                    <p className="text-sm text-foreground/55 truncate mt-0.5">{description}</p>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {level && (
                    <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
                    >
                        {level}
                    </span>
                )}
                {actions}
                <ChevronRight className="size-4 text-foreground/30 group-hover:translate-x-0.5 transition-transform" />
            </div>
        </div>
    );
}
