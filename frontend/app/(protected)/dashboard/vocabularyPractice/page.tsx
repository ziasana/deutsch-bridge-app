'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import Flashcard from '@/componenets/Flashcard'
import ActionButtons from '@/componenets/ActionButtons'
import Loading from '@/componenets/Loading'
import {addUserVocabularyPractice, getUserVocabularyForPractice} from "@/services/vocabularyService";
import {SaveVocabularyPracticeType, VocabularyForPracticeType,} from "@/types/vocabulary";
import {useI18n} from "@/componenets/I18nProvider";

export default function PracticePage() {
    const { t } = useI18n();
    const [vocabularies, setVocabularies] = useState<VocabularyForPracticeType[]>([]);
    const [index, setIndex] = useState(0)
    const [knownCount, setKnownCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [finished, setFinished] = useState(false)

    const getList = () => {
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
        setLoading(true)
        getList();
    }

    if (loading) return <Loading />;

    if (vocabularies.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center rounded-2xl bg-white px-10 py-8 shadow-lg text-center">
                    <span className="text-5xl">📚</span>
                    <h1 className="mt-4 text-2xl font-semibold text-gray-800">
                        {t.vocabulary.practice.noWords}
                    </h1>
                    <p className="mt-2 text-gray-500 max-w-xs">
                        {t.vocabulary.practice.noWordsSubtitle}
                    </p>
                    <Link
                        href="/dashboard/vocabulary"
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                        {t.vocabulary.practice.goToVocabulary}
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
                   {t.vocabulary.practice.successRate(successRate)}
                    <h1 className="mt-4 text-2xl font-semibold text-gray-800">
                        {t.vocabulary.practice.sessionFinished}
                    </h1>
                    <p className="mt-2 text-gray-500">
                        {t.vocabulary.practice.readyForAnother}
                    </p>

                    <button
                        onClick={handleStartPractice}
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                        {t.vocabulary.practice.startAgain}
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
