"use client";

import { LucideIcon } from "lucide-react";
import { readableOn } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

export interface HeroCollectionOption<K extends string> {
    key: K;
    label: string;
    count?: number;
    icon?: LucideIcon;
    color: string;
}

interface HeroCollectionFilterProps<K extends string> {
    options: HeroCollectionOption<K>[];
    selected: K;
    onSelect: (key: K) => void;
    ariaLabel: string;
}

/** Deep Navy would vanish on the navy panel, so it is drawn one step lighter while keeping the same hue. */
const onPanel = (color: string) => (color.toLowerCase() === "#16324f" ? "#2b5380" : color);

/** Collection / source pills for the navy page header: coloured icon, name and count; the selected one is filled with its colour. */
export default function HeroCollectionFilter<K extends string>({ options, selected, onSelect, ariaLabel }: Readonly<HeroCollectionFilterProps<K>>) {
    return (
        <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const active = opt.key === selected;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelect(opt.key)}
                        className={cn(
                            "inline-flex cursor-pointer items-center gap-2.5 rounded-full py-1.5 pe-4 ps-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                            active ? "ring-2 ring-white ring-offset-2 ring-offset-[#16324f]" : "bg-white/[0.08] hover:bg-white/[0.14]",
                        )}
                        style={active ? { backgroundColor: onPanel(opt.color), color: readableOn(opt.color) } : { color: "#ffffff" }}
                    >
                        {Icon ? (
                            <span
                                className="flex size-7 items-center justify-center rounded-full"
                                style={{ backgroundColor: active ? "rgba(255,255,255,0.22)" : onPanel(opt.color), color: active ? undefined : readableOn(opt.color) }}
                            >
                                <Icon className="size-4" aria-hidden="true" />
                            </span>
                        ) : (
                            <span aria-hidden="true" className="ms-1.5 size-2.5 rounded-full" style={{ backgroundColor: active ? "rgba(255,255,255,0.7)" : onPanel(opt.color) }} />
                        )}
                        {opt.label}
                        {opt.count !== undefined && <span className={cn("text-xs font-medium", active ? "opacity-80" : "text-[#b9c7d6]")}>{opt.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}
