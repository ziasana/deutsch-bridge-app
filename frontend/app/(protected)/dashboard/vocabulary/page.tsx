"use client";

import {toast, ToastContainer} from "react-toastify";
import * as React from "react";
import EditVocabularyModal from "@/componenets/EditVocabularyModal";
import {useEffect, useState} from "react";
import {DeleteVocabularyType, VocabularyPracticeType, VocabularyType} from "@/types/vocabulary";
import {deleteVocabulary, getUserVocabularyWithPractice} from "@/services/vocabularyService";
import Loading from "@/componenets/Loading";
import AddVocabularyModal from "@/componenets/AddVocabularyModal";
import CircularProgress from "@/componenets/CircularProgress";
import { useRouter } from "next/navigation";

export default function VocabularyPage() {
    const router = useRouter();
    const [vocabList, setVocabList] = useState<VocabularyPracticeType[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [selectedWord, setSelectedWord] = useState<VocabularyType | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const getList = () => {
        getUserVocabularyWithPractice()
            .then((data) => {
                    setVocabList(data?.data)
                }
            )
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        getList();
    }, []);

    if (loading) return <Loading/>;

    const handleDelete = (id: VocabularyType["id"]) => {
        setLoading(true);
        if (confirm("Are you sure you want to delete this word?")) {
            const deleteData: DeleteVocabularyType = {
                id: id
            }
            deleteVocabulary(deleteData)
                .then(() => {
                    toast.success("Vocabulary deleted!")
                })
                .catch((error) => console.error(error))
                // Refresh list after delete
                .finally(() => {
                    getList();
                    setLoading(false);
                });
        } else
            setLoading(false);
    };

    const filteredVocab = vocabList.filter((v) =>
        [v.word, v.example].some((field) =>
            field.toLowerCase().includes(search.toLowerCase())
        )
    );

    // Update only the edited item
    const handleWordUpdated = (updatedWord: VocabularyType) => {
        setVocabList((prev) =>
            prev.map((w) => (w.id === updatedWord.id ? updatedWord : w))
        );
    };

    // Update only the edited item
    const handleWordSaved = () => {
        getList();
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center">
            <div className="w-full max-w-3xl flex flex-col space-y-4 h-[calc(100vh-48px)]">
                {/* Sticky Header */}

                <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 group">
                    <button
                        onClick={() => router.push(" /dashboard/vocabularyPractice")}
                        className="
            w-14 h-14
            bg-green-600 hover:bg-green-700
            text-white text-xl
            rounded-full
            flex items-center justify-center
            animate-pulse
        ">
                        ▶
                    </button>
                    {/* Tooltip */}
                    <span
                        className="
            absolute right-16 top-1/2 -translate-y-1/2
            whitespace-nowrap
            bg-gray-800 text-white text-sm
            px-3 py-1 rounded
            opacity-0 group-hover:opacity-100
            transition
        ">
        Start vocabulary practice
    </span></div>

                <div
                    className="sticky top-0 bg-gray-100 dark:bg-gray-900 z-10 p-2 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Vocabulary
                    </h1>

                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search vocabulary..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none w-full md:w-64"
                        />
                        <button
                            // onClick={() => router.push("/dashboard/vocabulary/add")}
                            onClick={() => {
                                setIsAddModalOpen(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700"
                        >
                            Add New
                        </button>
                    </div>
                </div>

                {/* Scrollable Vocabulary List */}
                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                    {filteredVocab.length > 0 ? (
                        filteredVocab.map((vocab) => (
                            <div
                                key={vocab.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow flex flex-col md:flex-row justify-between items-start md:items-center"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {vocab.word}
                                    </h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Meaning:</span>{" "}
                                        {vocab.vocabularyContents ? vocab.vocabularyContents[0].meaning : null}
                                    </p>
                                    {vocab.example && (
                                        <>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Example:</span>{" "}
                                                {vocab.example}
                                            </p>
                                            {vocab.synonyms && (
                                                <>
                                                    <i className="font-italic">Synonyms:</i>
                                                    <span className="font-extralight">
                            {" "}
                                                        <i>{vocab.synonyms}</i>
                          </span>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2 md:mt-0">
                                    {vocab.vocabularyPractice?.[0]?.successRate == null ?
                                        <div className="relative w-[60px] h-[60px]">
                                            <CircularProgress value={0}/>
                                            <span
                                                className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                        {0}%
                                       </span>
                                        </div> :
                                        (
                                            <div className="relative w-[60px] h-[60px]">
                                                <CircularProgress value={vocab.vocabularyPractice[0].successRate}/>
                                                <span
                                                    className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                        {vocab.vocabularyPractice[0].successRate}%
                                       </span>
                                            </div>
                                        )
                                    }

                                    <button
                                        onClick={() => {
                                            setSelectedWord(vocab);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                        title="Edit"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.232 5.232l3.536 3.536M4 20h4l11-11-4-4-11 11v4z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vocab.id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                        title="Delete"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-700 dark:text-gray-300 text-center">
                            No vocabulary found.
                        </p>
                    )}
                    <ToastContainer/>
                    {/* Edit Modal */}
                    <EditVocabularyModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        word={selectedWord}
                        onSave={handleWordUpdated}
                    />
                    {/* Edit Modal */}
                    <AddVocabularyModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onSave={handleWordSaved}
                    />
                </div>

            </div>
        </div>
    );
}