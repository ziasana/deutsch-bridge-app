import { cn } from "@/lib/utils";

type LogoMarkProps = {
    size?: number;
    /** "tile" = amber mark on a navy rounded tile (default); "bare" = amber mark only, for navy surfaces. */
    variant?: "tile" | "bare";
    className?: string;
};

/** DeutschCertify mark. Decorative - pair with the wordmark or a text label. */
export function LogoMark({ size = 36, variant = "tile", className }: LogoMarkProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={variant === "tile" ? "/brand/mark.svg" : "/brand/mark-on-dark.svg"}
            width={size}
            height={size}
            alt=""
            aria-hidden="true"
            className={cn("shrink-0 select-none", className)}
        />
    );
}

type LogoProps = {
    size?: number;
    variant?: "tile" | "bare";
    /** Hide the wordmark below the sm breakpoint. */
    collapseText?: boolean;
    className?: string;
    textClassName?: string;
};

/** Mark + "DeutschCertify" wordmark. The wordmark inherits the text colour of its parent. */
export function Logo({ size = 36, variant = "tile", collapseText = false, className, textClassName }: LogoProps) {
    return (
        <span className={cn("inline-flex items-center gap-2.5", className)}>
            <LogoMark size={size} variant={variant} />
            <span className={cn("truncate text-lg font-semibold tracking-tight", collapseText && "hidden sm:inline", textClassName)}>
                DeutschCertify
            </span>
        </span>
    );
}
