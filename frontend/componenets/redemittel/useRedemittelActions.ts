"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { learnRedemittel, saveRedemittel, unsaveRedemittel } from "@/services/redemittelService";
import { Redemittel } from "@/types/redemittel";

function errorMessage(err: unknown, fallback: string) {
    return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

/** Save / learn actions shared by every place that shows a Redemittel (hub, detail, Schreiben dialog). */
export function useRedemittelActions(onUpdated?: (updated: Redemittel) => void) {
    const queryClient = useQueryClient();

    const afterChange = (updated: Redemittel) => {
        queryClient.setQueryData(["redemittel", "detail", updated.id], updated);
        queryClient.invalidateQueries({ queryKey: ["redemittel", "list"] });
        queryClient.invalidateQueries({ queryKey: ["redemittel", "hub"] });
        onUpdated?.(updated);
    };

    const toggleSave = useMutation({
        mutationFn: (r: Redemittel) => (r.saved ? unsaveRedemittel(r.id) : saveRedemittel(r.id)).then((res) => res.data),
        onSuccess: afterChange,
        onError: (err) => toast.error(errorMessage(err, "Die Sammlung konnte nicht aktualisiert werden.")),
    });

    const learn = useMutation({
        mutationFn: (r: Redemittel) => learnRedemittel(r.id).then((res) => res.data),
        onSuccess: afterChange,
        onError: (err) => toast.error(errorMessage(err, "Das Redemittel konnte nicht gespeichert werden.")),
    });

    return { toggleSave, learn };
}
