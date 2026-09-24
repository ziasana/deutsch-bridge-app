import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/componenets/ui/card";

export interface AdminStatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    href?: string;
    ctaLabel?: string;
    className?: string;
}

const CARD_HOVER = "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

export default function AdminStatCard({ title, value, description, icon: Icon, href, ctaLabel, className }: Readonly<AdminStatCardProps>) {
    const content = (
        <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                        <Icon className="size-6 text-accent-foreground" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <span className="text-sm text-foreground/60">{title}</span>
                    </div>
                </div>
            </div>
            {(description || ctaLabel) && (
                <div className="flex items-center justify-between">
                    {description && <p className="text-xs text-foreground/50">{description}</p>}
                    {ctaLabel && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            {ctaLabel}
                            <ChevronRight className="size-3.5" />
                        </span>
                    )}
                </div>
            )}
        </CardContent>
    );

    if (!href) {
        return <Card className={cn(className)}>{content}</Card>;
    }

    return (
        <Link href={href} className="block" aria-label={ctaLabel ?? title}>
            <Card className={cn(CARD_HOVER, "cursor-pointer", className)}>{content}</Card>
        </Link>
    );
}
