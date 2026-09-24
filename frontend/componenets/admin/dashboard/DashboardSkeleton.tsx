export default function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-[10px] bg-foreground/10" />
                ))}
            </div>
            <div className="h-40 rounded-[10px] bg-foreground/10" />
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-64 rounded-[10px] bg-foreground/10" />
                <div className="h-64 rounded-[10px] bg-foreground/10" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-64 rounded-[10px] bg-foreground/10" />
                <div className="h-64 rounded-[10px] bg-foreground/10" />
            </div>
            <div className="h-32 rounded-[10px] bg-foreground/10" />
        </div>
    );
}
