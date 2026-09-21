"use client";

import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
    label: string;
    description?: string;
    icon?: LucideIcon;
    emoji?: string;
    active: boolean;
    onClick: () => void;
    multi?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function SelectionCard({
    label,
    description,
    icon: Icon,
    emoji,
    active,
    onClick,
    multi,
    disabled,
    className,
}: SelectionCardProps) {
    return (
        <button
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                active
                    ? "border-primary bg-primary/[0.06]"
                    : "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lg",
                disabled && "opacity-40 pointer-events-none",
                className,
            )}
        >
            {(Icon || emoji) && (
                <div
                    className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-lg",
                        active ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
                    )}
                >
                    {Icon ? <Icon className="size-5" /> : emoji}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className={cn("font-semibold truncate", active ? "text-primary" : "text-foreground")}>{label}</p>
                {description && <p className="text-sm text-foreground/55">{description}</p>}
            </div>
            <div
                className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    multi
                        ? active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        : active
                            ? "border-primary bg-primary"
                            : "border-border",
                )}
            >
                {multi ? active && <Check className="size-3.5" /> : active && <span className="size-2 rounded-full bg-primary-foreground" />}
            </div>
        </button>
    );
}
