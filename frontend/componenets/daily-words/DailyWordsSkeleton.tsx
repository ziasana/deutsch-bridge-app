export default function DailyWordsSkeleton() {
    return (
        <div className="max-w-2xl mx-auto animate-pulse">
            <div className="h-8 w-48 rounded bg-foreground/10" />
            <div className="h-4 w-64 rounded bg-foreground/10 mt-3" />
            <div className="h-1.5 w-full rounded-full bg-foreground/10 mt-6" />

            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-8 shadow-card">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-4 w-20 rounded bg-foreground/10" />
                    <div className="h-9 w-40 rounded bg-foreground/10" />
                    <div className="h-6 w-12 rounded-full bg-foreground/10" />
                    <div className="h-5 w-28 rounded bg-foreground/10 mt-2" />
                    <div className="h-16 w-full rounded-lg bg-foreground/10 mt-2" />
                    <div className="flex gap-3 w-full mt-4">
                        <div className="h-10 flex-1 rounded-lg bg-foreground/10" />
                        <div className="h-10 flex-1 rounded-lg bg-foreground/10" />
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-foreground/10" />
                ))}
            </div>
        </div>
    );
}
