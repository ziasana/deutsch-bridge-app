// Words rise in three fixed lanes (columns), two words per lane half a cycle apart, so a word never meets another one:
// different lanes never share a column, and words in the same lane are always about half the hero apart.
const LANES = 3;
const WORD_MOTION = [
    { size: "text-sm", duration: 11, sway: 8 },
    { size: "text-base", duration: 13, sway: 7 },
    { size: "text-sm", duration: 12, sway: 8 },
    { size: "text-base", duration: 11, sway: 7 },
    { size: "text-sm", duration: 13, sway: 8 },
    { size: "text-sm", duration: 12, sway: 7 },
];

// Bubble colors: the app's own learning colors, so a hero matches the rest of the app.
const BUBBLE_TONES = [
    "bg-primary",
    "bg-learning-reading",
    "bg-learning-vocabulary",
    "bg-learning-review",
    "bg-learning-expression",
    "bg-learning-grammar",
];

export const MAX_RISING_WORDS = WORD_MOTION.length;

/** The learner's own words floating up the right side of a hero as speech bubbles (see `.rise-bubble` in globals.css). */
export default function RisingWords({ words }: Readonly<{ words: string[] }>) {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block">
            {words.slice(0, WORD_MOTION.length).map((word, index) => {
                const m = WORD_MOTION[index];
                const lane = index % LANES;
                const tier = Math.floor(index / LANES);
                return (
                    <div key={word} className="absolute inset-y-0 overflow-hidden" style={{ left: `${(lane * 100) / LANES}%`, width: `${100 / LANES}%` }}>
                        <span
                            className={`rise-bubble inset-x-0 mx-auto w-fit max-w-[6.75rem] truncate rounded-2xl rounded-bl-sm px-3 py-1.5 font-semibold text-white shadow-lg ${m.size} ${BUBBLE_TONES[index % BUBBLE_TONES.length]}`}
                            style={{
                                ["--sway" as string]: `${m.sway}px`,
                                ["--bubble-duration" as string]: `${m.duration}s`,
                                // Staggered, and negative so every word is already mid-flight when the page opens.
                                ["--bubble-delay" as string]: `${-(m.duration * (tier * 0.5 + (lane * 0.17 + 0.05)))}s`,
                                ["--bubble-rest" as string]: `${tier === 0 ? 18 : 58}%`,
                            }}
                        >
                            {word}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
