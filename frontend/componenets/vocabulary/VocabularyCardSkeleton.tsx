export default function VocabularyCardSkeleton() {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-card animate-pulse">
            <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-24 rounded-md bg-foreground/10" />
                <div className="h-9 w-9 rounded-full bg-foreground/10" />
            </div>
            <div className="space-y-2">
                <div className="h-5 w-3/4 rounded bg-foreground/10" />
                <div className="h-4 w-1/2 rounded bg-foreground/10" />
            </div>
            <div className="h-12 w-full rounded-lg bg-foreground/10" />
            <div className="space-y-2 pt-1">
                <div className="h-3 w-full rounded bg-foreground/10" />
                <div className="h-3 w-full rounded bg-foreground/10" />
            </div>
            <div className="h-9 w-full rounded-lg bg-foreground/10" />
        </div>
    );
}
