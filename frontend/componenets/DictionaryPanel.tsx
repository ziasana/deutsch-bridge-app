"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDictionaryLookup } from "@/hooks/useDictionaryLookup";
import { saveVocab, removeVocab } from "@/services/vocabService";
import { reportMissingWord } from "@/services/dictionaryService";

const GENDER_COLORS: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    die: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
    das: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};

function playAudio(url: string | null) {
    if (!url) return;
    new Audio(url).play().catch(() => {
        // Autoplay/network failures are non-critical here; the user can retry the tap.
    });
}

export default function DictionaryPanel({
    activeLemma,
    onClose,
}: Readonly<{ activeLemma: string | null; onClose: () => void }>) {
    const { entry, lemma, loading, notFound, lookup, updateCachedEntry, reset } = useDictionaryLookup();
    const [searchValue, setSearchValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [reported, setReported] = useState(false);

    useEffect(() => {
        if (activeLemma) {
            lookup(activeLemma);
            setSearchValue(activeLemma);
            setReported(false);
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLemma]);

    if (!activeLemma) return null;

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) return;
        setReported(false);
        lookup(searchValue);
    };

    const toggleSave = () => {
        if (!entry) return;
        setSaving(true);
        const wasSaved = entry.savedByCurrentUser;
        const action = wasSaved ? removeVocab(entry.id) : saveVocab(entry.id);
        action
            .then(() => {
                updateCachedEntry({ ...entry, savedByCurrentUser: !wasSaved });
                toast.success(wasSaved ? "Removed from vocab." : "Added to vocab.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update vocab."))
            .finally(() => setSaving(false));
    };

    const flagMissing = () => {
        if (!lemma) return;
        reportMissingWord(lemma)
            .then(() => {
                setReported(true);
                toast.success("Thanks — we'll look into it.");
            })
            .catch(() => toast.error("Failed to report this word."));
    };

    return (
        <>
            <button
                aria-label="Close dictionary panel"
                onClick={onClose}
                className="fixed inset-0 bg-black/20 z-40 md:hidden"
            />
            <aside
                className="fixed z-50 bg-white dark:bg-gray-800 shadow-2xl flex flex-col
                    inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
                    md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-full
                    md:w-[400px] md:rounded-none md:border-l md:border-gray-200 md:dark:border-gray-700"
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <form onSubmit={submitSearch} className="flex-1 flex gap-2">
                        <input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search a word..."
                            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shrink-0"
                        >
                            Go
                        </button>
                    </form>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none px-2 shrink-0"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}

                    {!loading && notFound && (
                        <div className="text-center py-8 space-y-3">
                            <p className="text-gray-500 dark:text-gray-400">
                                No dictionary entry found for &quot;{lemma}&quot;.
                            </p>
                            <button
                                onClick={flagMissing}
                                disabled={reported}
                                className="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-60"
                            >
                                {reported ? "Reported ✓" : "Flag as missing"}
                            </button>
                        </div>
                    )}

                    {!loading && entry && (
                        <>
                            <div className="flex items-center gap-2 flex-wrap">
                                {entry.article && (
                                    <span className={`text-sm px-2 py-0.5 rounded-full ${GENDER_COLORS[entry.article] ?? ""}`}>
                                        {entry.article}
                                    </span>
                                )}
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{entry.lemma}</h2>
                            </div>

                            {entry.ipa && (
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                    <span>/{entry.ipa}/</span>
                                    {entry.audioUrl && (
                                        <button
                                            onClick={() => playAudio(entry.audioUrl)}
                                            aria-label="Play pronunciation"
                                            className="text-blue-600 dark:text-blue-400"
                                        >
                                            🔊
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                {entry.senses.map((sense) => (
                                    <div key={sense.id} className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                            {sense.pos}
                                        </span>
                                        <p className="text-gray-900 dark:text-white mt-1">
                                            {sense.translations.join(", ")}
                                        </p>
                                        {sense.examples.length > 0 && (
                                            <ul className="mt-2 space-y-2">
                                                {sense.examples.map((ex) => (
                                                    <li
                                                        key={ex.id}
                                                        className="text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span className="italic text-gray-800 dark:text-gray-200">
                                                                {ex.de}
                                                            </span>
                                                            {ex.audioUrl && (
                                                                <button
                                                                    onClick={() => playAudio(ex.audioUrl)}
                                                                    aria-label="Play example audio"
                                                                    className="text-blue-600 dark:text-blue-400 shrink-0"
                                                                >
                                                                    🔊
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-500 dark:text-gray-400">{ex.en}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={toggleSave}
                                disabled={saving}
                                className={`w-full mt-2 rounded-xl py-2.5 font-semibold transition disabled:opacity-60 ${
                                    entry.savedByCurrentUser
                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                {entry.savedByCurrentUser ? "✓ Saved to vocab" : "+ Add to vocab"}
                            </button>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
