import { cn } from "@/lib/utils";
import { WRITING_LEVELS } from "./writingMeta";

interface Props {
    level: string;
    onChange: (level: string) => void;
    className?: string;
}

export default function WritingLevelChips({ level, onChange, className }: Props) {
    return (
        <div role="group" aria-label="Niveau" className={cn("flex flex-wrap gap-2", className)}>
            {WRITING_LEVELS.map((l) => (
                <button
                    key={l}
                    type="button"
                    aria-pressed={l === level}
                    onClick={() => onChange(l)}
                    className={cn(
                        "rounded-full border px-3.5 py-1 text-sm font-medium transition cursor-pointer",
                        l === level ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/70 hover:bg-accent",
                    )}
                >
                    {l}
                </button>
            ))}
        </div>
    );
}
