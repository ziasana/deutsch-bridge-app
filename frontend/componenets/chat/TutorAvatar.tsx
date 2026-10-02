import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** The AI tutor's round brand avatar, used next to its messages, while it is thinking and on the welcome screen. */
export default function TutorAvatar({ className, iconClassName }: Readonly<{ className?: string; iconClassName?: string }>) {
    return (
        <span
            aria-hidden="true"
            className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] text-white shadow-sm", className)}
        >
            <Sparkles className={cn("size-4", iconClassName)} />
        </span>
    );
}
