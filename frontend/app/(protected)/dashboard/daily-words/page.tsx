"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getDailyWords } from "@/services/dailyWordService";
import { setLearningProgress } from "@/services/grammarService";
import { addVocabulary, getUserVocabularies } from "@/services/vocabularyService";
import { DailyWord } from "@/types/dailyWord";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";

const normalize = (word: string) => word.trim().toLowerCase();

export default function DailyWordsPage() {
    const [words, setWords] = useState<DailyWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getDailyWords(), getUserVocabularies()])
            .then(([wordsRes, vocabRes]) => {
                setWords(wordsRes.data);
                setSavedWords(new Set(vocabRes.data.map((v) => normalize(v.word))));
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load today's words."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const learnedCount = words.filter((w) => w.learned).length;

    const toggleLearned = (word: DailyWord) => {
        setUpdatingId(word.id);
        setLearningProgress({ dailyWordId: word.id, learned: !word.learned })
            .then(() => {
                setWords((prev) =>
                    prev.map((w) => (w.id === word.id ? { ...w, learned: !w.learned } : w))
                );
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingId(null));
    };

    const saveToVocabulary = (word: DailyWord) => {
        setSavingId(word.id);
        addVocabulary({ word: word.word, example: word.example, meaning: word.meaning })
            .then(() => {
                setSavedWords((prev) => new Set(prev).add(normalize(word.word)));
                toast.success(`"${word.word}" added to your Vocabulary!`);
            })
            .catch((err) => {
                const message: string | undefined = err?.response?.data?.message;
                if (message?.toLowerCase().includes("already exists")) {
                    setSavedWords((prev) => new Set(prev).add(normalize(word.word)));
                } else {
                    toast.error(message ?? "Failed to save word to your Vocabulary.");
                }
            })
            .finally(() => setSavingId(null));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Daily Words</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    5 new words to learn today, with examples and synonyms. Come back tomorrow for a fresh set.
                </p>

                {words.length > 0 && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        {learnedCount} / {words.length} learned today
                    </p>
                )}

                <div className="mt-6 space-y-4">
                    {words.map((word) => (
                        <div
                            key={word.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {word.word}
                                    </h2>
                                    <Badge variant="secondary">{word.level}</Badge>
                                    {word.learned && <Badge variant="default">Learned</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        className="text-sm px-4 py-2"
                                        disabled={savingId === word.id || savedWords.has(normalize(word.word))}
                                        onClick={() => saveToVocabulary(word)}
                                    >
                                        {savingId === word.id
                                            ? "Saving..."
                                            : savedWords.has(normalize(word.word))
                                                ? "✓ In Vocabulary"
                                                : "+ Save to Vocabulary"}
                                    </Button>
                                    <Button
                                        variant={word.learned ? "secondary" : "primary"}
                                        className="text-sm px-4 py-2"
                                        disabled={updatingId === word.id}
                                        onClick={() => toggleLearned(word)}
                                    >
                                        {updatingId === word.id
                                            ? "Saving..."
                                            : word.learned
                                                ? "Mark as not learned"
                                                : "Mark as learned"}
                                    </Button>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                                <span className="font-medium">Meaning:</span> {word.meaning}
                            </p>
                            {word.example && (
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    <span className="font-medium">Example:</span> {word.example}
                                </p>
                            )}
                            {word.synonyms && (
                                <p className="text-gray-500 dark:text-gray-400 mt-1 italic">
                                    Synonyms: {word.synonyms}
                                </p>
                            )}
                        </div>
                    ))}

                    {words.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            No daily words available yet.
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
