type Props = {
    onKnow: () => void
    onDontKnow: () => void
}

export default function ActionButtons({ onKnow, onDontKnow }: Readonly<Props>) {
    return (
        <div className="mt-6 flex gap-4">
            <button
                onClick={onDontKnow}
                className="flex-1 rounded-xl bg-red-100 py-3 font-semibold text-red-700 hover:bg-red-200"
            >
                I don’t know
            </button>

            <button
                onClick={onKnow}
                className="flex-1 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
            >I know
            </button>
        </div>
    )
}
