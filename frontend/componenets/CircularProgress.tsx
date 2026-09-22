type CircularProgressProps = {
    value: number
    size?: number
    color?: string
    trackColor?: string
    showLabel?: boolean
}
export default function CircularProgress({
    value,
    size = 60,
    color = "#22c55e",
    trackColor = "#e5e7eb",
    showLabel = false,
}: Readonly<CircularProgressProps> ) {
    const radius = size / 2 - 6;
    const center = size / 2;
    const circumference: number = 2 * Math.PI * radius;
    const offset: number = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth="6"
                    fill="none"
                />

                {/* Progress circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </svg>
            {showLabel && (
                <span className="absolute text-sm font-semibold text-foreground">
                    {Math.round(value)}%
                </span>
            )}
        </div>
    );
}
