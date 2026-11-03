import { cn } from "@/lib/utils";

/** A grey placeholder block that pulses (not for users who prefer reduced motion). Size and shape come from className. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
    return <div aria-hidden="true" className={cn("rounded-lg bg-foreground/10 motion-safe:animate-pulse", className)} {...props} />;
}
