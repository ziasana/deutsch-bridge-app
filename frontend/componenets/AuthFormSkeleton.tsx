import { Skeleton } from "@/componenets/ui/skeleton";

/** Form-shaped placeholder for the login and signup pages while their client code loads. */
export default function AuthFormSkeleton({ fields = 2 }: Readonly<{ fields?: number }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4 py-12">
            <span className="sr-only">Loading...</span>
            <div className="w-full max-w-2xl space-y-5 rounded-2xl bg-card p-8 shadow-card sm:p-12">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                {Array.from({ length: fields }, (_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                ))}
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}
