"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicOverview } from "@/services/publicLearnService";

/** Per-level totals for the four content types; shared by the landing page, the home teaser and every level selector. */
export function usePublicOverview() {
    return useQuery({
        queryKey: ["public", "learn", "overview"],
        queryFn: () => getPublicOverview().then((res) => res.data),
        staleTime: 10 * 60 * 1000,
    });
}
