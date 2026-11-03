import DashboardSkeleton from "@/componenets/dashboard/DashboardSkeleton";

/** Shown by Next while the dashboard's code arrives: the same placeholders the page shows while its data loads, so nothing jumps. */
export default function DashboardLoading() {
    return (
        <div className="dashboard-atmosphere min-h-full px-4 py-8 sm:px-6 sm:py-10">
            <DashboardSkeleton />
        </div>
    );
}
