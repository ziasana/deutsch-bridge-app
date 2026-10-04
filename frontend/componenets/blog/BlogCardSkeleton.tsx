export default function BlogCardSkeleton() {
    return (
        <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-card shadow-card">
            <div className="aspect-[16/9] bg-muted" />
            <div className="flex flex-col gap-3 p-6">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-5 w-4/5 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
        </div>
    );
}
