import { Suspense, ReactNode } from "react";

type Props = {
    children: ReactNode;
    fallback?: ReactNode;
};

export default function SearchParamsSuspense({
                                                 children,
                                                 fallback = <div>Loading...</div>,
                                             }: Props) {
    return <Suspense fallback={fallback}>{children}</Suspense>;
}
