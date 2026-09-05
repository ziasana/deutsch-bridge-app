'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import Flashcard from '@/componenets/Flashcard'
import ActionButtons from '@/componenets/ActionButtons'
import Loading from '@/componenets/Loading'
import {addUserVocabularyPractice, getUserVocabularyForPractice} from "@/services/vocabularyService";
import {SaveVocabularyPracticeType, VocabularyForPracticeType,} from "@/types/vocabulary";

export default function PracticePage() {
    const [vocabularies, setVocabularies] = useState<VocabularyForPracticeType[]>([]);
    const [index, setIndex] = useState(0)
    const [knownCount, setKnownCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [finished, setFinished] = useState(false)

    const getList = () => {
        setLoading(true)
        getUserVocabularyForPractice()
            .then((data) => {
                setVocabularies(data?.data)
                }
            )
            .catch((err) => console.error(err))
            .finally(() => setLoading(false))
    };

    useEffect(() => {
        getList();
    }, []);

    const current =
        !finished && vocabularies.length > 0 && index >= 0 ? vocabularies[index] : null

    const next = () => {
        if (index + 1 < vocabularies.length) {
            setIndex(index + 1)
        }
        else {
            setFinished(true) // session finished
        }
    }

    const submitAnswer = async (known: boolean) => {
        if (!current) return
       const practiceData: SaveVocabularyPracticeType ={
           vocabularyId: current.id,
            known: known
       }
        addUserVocabularyPractice(practiceData)
            .then()
            .catch((err) => console.error(err))
       if (known) setKnownCount((c) => c + 1)

        next()
    }

    const handleStartPractice = () => {
        setIndex(0)
        setKnownCount(0)
        setFinished(false)
        getList();
    }

    if (loading) return <Loading />;

    if (vocabularies.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center rounded-2xl bg-white px-10 py-8 shadow-lg text-center">
                    <span className="text-5xl">📚</span>
                    <h1 className="mt-4 text-2xl font-semibold text-gray-800">
                        No words to practice right now
                    </h1>
                    <p className="mt-2 text-gray-500 max-w-xs">
                        Add new words to your vocabulary, or come back once you have more to review.
                    </p>
                    <Link
                        href="/dashboard/vocabulary"
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                        Go to My Vocabulary
                    </Link>
                </div>
            </div>
        )
    }

    if (finished) {
        const successRate = Math.round((knownCount * 100) / vocabularies.length);
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center rounded-2xl bg-white px-10 py-8 shadow-lg">
                    <span className="text-5xl">🎉</span>
                   Success Rate: { successRate }%
                    <h1 className="mt-4 text-2xl font-semibold text-gray-800">
                        Session finished
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Great job! Ready for another round?
                    </p>

                    <button
                        onClick={handleStartPractice}
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                        Start again
                    </button>
                </div>
            </div>
        )
    }

    if (!current) return null;

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
            <div>
                <Flashcard key={current.id} {...current} />
                <ActionButtons
                    onKnow={() => submitAnswer(true)}
                    onDontKnow={() => submitAnswer(false)}
                />
            </div>
        </div>
    )
}
