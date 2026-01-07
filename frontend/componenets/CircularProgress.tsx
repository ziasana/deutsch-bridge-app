type CircularProgressProps = {
    value: number
}
export default function CircularProgress({value}: Readonly<CircularProgressProps> ) {
    const radius = 24;
    const circumference: number = 2 * Math.PI * radius;
    const offset: number = circumference - (value / 100) * circumference;

    return (
        <svg width="60" height="60">
            {/* Background circle */}
            <circle
                cx="30"
                cy="30"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
            />

            {/* Progress circle */}
            <circle
                cx="30"
                cy="30"
                r={radius}
                stroke="#22c55e"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
            />
        </svg>
    );
}
