import PageSkeleton from "@/componenets/PageSkeleton";

/** Shown by Next while a protected route's code is still arriving: a page-shaped placeholder instead of a full-screen loader. */
export default function ProtectedLoading() {
    return <PageSkeleton />;
}
