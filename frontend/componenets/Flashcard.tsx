'use client'
import { useState } from 'react'

type Props = {
    word: string
    example: string
    synonyms: string
    meaning: string
}

export default function Flashcard({ word, example,synonyms, meaning}: Readonly<Props>) {
    const [showMeaning, setShowMeaning] = useState(false)

    return (
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-center text-gray-900">
                {word}
            </h2>

            <p className="mt-4 mb-2 text-center italic text-gray-600">
                {example}

            </p>

            {showMeaning && (
                <div className="border-t pt-2 pb-2">
                    <p>
                        <strong>Meaning: {meaning}</strong>
                    </p>
                    <p>
                        <i> Synonyms: {synonyms}</i>
                    </p>

                </div>
            )}

            {!showMeaning && (
                <button
                    onClick={() => setShowMeaning(true)}
                    className="mt-6 w-full rounded-xl bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                >
                    Show meaning
                </button>
            )}
        </div>
    )
}
