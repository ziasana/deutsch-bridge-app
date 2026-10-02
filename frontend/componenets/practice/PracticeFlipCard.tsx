"use client";

import { ReactNode } from "react";
import { RotateCw } from "lucide-react";

interface PracticeFlipCardProps {
    flipped: boolean;
    onToggle: () => void;
    ariaLabel: string;
    front: ReactNode;
    back: ReactNode;
    frontHint: string;
}

/** Big 3D flip card: white front with the item, brand-gradient back with the answer. Space or Enter flips it. */
export default function PracticeFlipCard({ flipped, onToggle, ariaLabel, front, back, frontHint }: Readonly<PracticeFlipCardProps>) {
    return (
        <div className="flip-scene h-80 sm:h-96">
            <div
                role="button"
                tabIndex={0}
                aria-pressed={flipped}
                aria-label={ariaLabel}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className="relative block h-full w-full cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
                <div className="flip-inner relative h-full w-full" data-flipped={flipped}>
                    <div
                        aria-hidden={flipped}
                        className="flip-face absolute inset-0 flex flex-col items-center justify-between rounded-3xl border-t-4 border-primary bg-card p-6 text-center shadow-card"
                    >
                        <span />
                        <div className="flex flex-col items-center gap-3">{front}</div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/50">
                            <RotateCw className="size-3.5" aria-hidden="true" />
                            {frontHint}
                        </span>
                    </div>

                    <div
                        aria-hidden={!flipped}
                        className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] p-6 text-center text-white shadow-lg"
                    >
                        {back}
                    </div>
                </div>
            </div>
        </div>
    );
}
