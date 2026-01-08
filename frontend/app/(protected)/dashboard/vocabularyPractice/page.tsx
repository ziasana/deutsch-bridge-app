'use client'

import {useEffect, useState} from 'react'
import Flashcard from '@/componenets/Flashcard'
import ActionButtons from '@/componenets/ActionButtons'
import {addUserVocabularyPractice, getUserVocabularyForPractice} from "@/services/vocabularyService";
import {SaveVocabularyPracticeType, VocabularyForPracticeType,} from "@/types/vocabulary";

export default function PracticePage() {
    const [vocabularies, setVocabularies] = useState<VocabularyForPracticeType[]>([]);
    const [index, setIndex] = useState(0)
    const [knownCount, setKnownCount] = useState(0)

    const getList = () => {
        getUserVocabularyForPractice()
            .then((data) => {
                setVocabularies(data?.data)
                }
            )
            .catch((err) => console.error(err))
    };

    useEffect(() => {
        getList();
    }, []);

    const current =
        vocabularies.length > 0 && index >= 0 ? vocabularies[index] : null


    const next = () => {
        if (index + 1 < vocabularies.length) {
            setIndex(index + 1)
        }
        else {
            setIndex(-1) // session finished
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
        setVocabularies([])
        setIndex(0)
        setKnownCount(0)
        getList();
    }
    if (!current) {
        const successRate = (knownCount* 100)/ vocabularies.length;
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

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
            <div>
                <Flashcard {...current} />
                <ActionButtons
                    onKnow={() => submitAnswer(true)}
                    onDontKnow={() => submitAnswer(false)}
                />
            </div>
        </div>
    )
}
