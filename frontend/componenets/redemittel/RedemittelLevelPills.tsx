"use client";

import { cn } from "@/lib/utils";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { REDEMITTEL_LEVELS } from "./redemittelMeta";

interface Props {
    value: string;
    onChange: (level: string) => void;
}

/**
 * Level filter as a row of colored pills with the app's level icons and colors. Inactive pills are a
 * soft tint of their level color, the active one is solid. "ALL" means no filter.
 */
export default function RedemittelLevelPills({ value, onChange }: Readonly<Props>) {
    return (
        <div role="group" aria-label="Niveau" className="flex flex-wrap items-center gap-1.5">
            {["ALL", ...REDEMITTEL_LEVELS].map((l) => {
                const active = value === l;
                const meta = l === "ALL" ? null : getLevelMeta(l);
                const Icon = meta?.icon;
                return (
                    <button
                        key={l}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(l)}
                        className={cn(
                            "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 cursor-pointer",
                            active ? "scale-105 border-transparent text-white shadow-md" : "border-transparent hover:-translate-y-0.5 hover:shadow-sm",
                            !meta && (active ? "bg-foreground text-background" : "bg-foreground/8 text-foreground/70"),
                        )}
                        style={
                            meta
                                ? active
                                    ? { backgroundColor: meta.color }
                                    : { backgroundColor: `${meta.color}1a`, color: meta.color }
                                : undefined
                        }
                    >
                        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                        {l === "ALL" ? "Alle" : l}
                    </button>
                );
            })}
        </div>
    );
}
