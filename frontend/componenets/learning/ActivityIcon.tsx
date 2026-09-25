import { cn } from "@/lib/utils";
import { ACTIVITY_CONFIG, ActivityType } from "./activityConfig";

const SIZE_CLASSES = {
    sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
    md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
    lg: { box: "h-12 w-12 rounded-xl", icon: "h-6 w-6" },
} as const;

interface ActivityIconProps {
    type: ActivityType;
    size?: keyof typeof SIZE_CLASSES;
    className?: string;
}

export default function ActivityIcon({ type, size = "md", className }: ActivityIconProps) {
    const { icon: Icon, iconClass, bgClass } = ACTIVITY_CONFIG[type];
    const s = SIZE_CLASSES[size];

    return (
        <div className={cn("flex shrink-0 items-center justify-center", s.box, bgClass, className)}>
            <Icon className={cn(s.icon, iconClass)} aria-hidden="true" />
        </div>
    );
}
