"use client";

import { useCallback, useState } from "react";
import { lookupDictionaryEntry } from "@/services/dictionaryService";
import { DictionaryEntry } from "@/types/dictionary";

/**
 * Module-level cache (not component state) so it survives across every panel open/close within
 * the browser session - mirrors the spec's "React Query with staleTime: Infinity" behavior
 * without adding a data-fetching library dependency this project doesn't otherwise use.
 * `null` means "confirmed not found", distinct from "not yet looked up" (absent from the map).
 */
const cache = new Map<string, DictionaryEntry | null>();

export function useDictionaryLookup() {
    const [entry, setEntry] = useState<DictionaryEntry | null>(null);
    const [lemma, setLemma] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const lookup = useCallback((rawLemma: string) => {
        const trimmed = rawLemma.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();

        setLemma(trimmed);
        setNotFound(false);

        if (cache.has(key)) {
            const cached = cache.get(key) ?? null;
            setEntry(cached);
            setNotFound(cached === null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setEntry(null);
        lookupDictionaryEntry(trimmed)
            .then((res) => {
                cache.set(key, res.data);
                setEntry(res.data);
            })
            .catch((err) => {
                if (err?.response?.status === 404) {
                    cache.set(key, null);
                    setNotFound(true);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const updateCachedEntry = useCallback((updated: DictionaryEntry) => {
        cache.set(updated.lemma.toLowerCase(), updated);
        setEntry(updated);
    }, []);

    const reset = useCallback(() => {
        setEntry(null);
        setLemma(null);
        setNotFound(false);
    }, []);

    return { entry, lemma, loading, notFound, lookup, updateCachedEntry, reset };
}
