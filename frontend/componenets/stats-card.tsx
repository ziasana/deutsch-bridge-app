import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: React.ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function StatsCard({
                              title,
                              value,
                              subtitle,
                              icon,
                              trend,
                              className,
                          }: StatsCardProps) {
    return (
        <Card className={cn("border-border/50", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{value}</span>
                    {trend && (
                        <span
                            className={cn(
                                "text-sm font-medium",
                                trend.isPositive ? "text-chart-3" : "text-destructive"
                            )}
                        >
              {trend.isPositive ? "+" : ""}
                            {trend.value}%
            </span>
                    )}
                </div>
                {subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    )
}
