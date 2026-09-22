export default function DashboardSkeleton() {
    return (
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
            <div>
                <div className="h-8 w-64 rounded bg-foreground/10" />
                <div className="h-4 w-48 rounded bg-foreground/10 mt-3" />
                <div className="h-7 w-40 rounded-full bg-foreground/10 mt-4" />
            </div>

            <div className="h-48 rounded-[10px] bg-foreground/10" />

            <div className="grid gap-6 md:grid-cols-2">
                <div className="h-56 rounded-[10px] bg-foreground/10" />
                <div className="h-56 rounded-[10px] bg-foreground/10" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="h-40 rounded-[10px] bg-foreground/10" />
                <div className="h-40 rounded-[10px] bg-foreground/10" />
            </div>
        </div>
    );
}
