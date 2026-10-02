import { Suspense, ReactNode } from "react";
import Loading from "@/componenets/Loading";

type Props = {
    children: ReactNode;
    fallback?: ReactNode;
};

export default function SearchParamsSuspense({
                                                 children,
                                                 fallback = <Loading />,
                                             }: Props) {
    return <Suspense fallback={fallback}>{children}</Suspense>;
}
