// Glassy bubbles that rise from the bottom of a hero, sway, swell and shrink a little and fade out near the top (see `.rise-bubble` in globals.css).
// Fixed slots keep server and client output identical: left (%), diameter (px), rise duration (s), negative delay (s) so they are mid-flight on load,
// and the resting position (%) used when the user prefers reduced motion.
const BUBBLES = [
    { left: 6, size: 12, duration: 8, delay: -1, rest: 25 },
    { left: 18, size: 30, duration: 11, delay: -4, rest: 60 },
    { left: 30, size: 9, duration: 7.5, delay: -6, rest: 45 },
    { left: 42, size: 20, duration: 9.5, delay: -2.5, rest: 22 },
    { left: 54, size: 34, duration: 12.5, delay: -9, rest: 70 },
    { left: 64, size: 10, duration: 8.5, delay: -5, rest: 35 },
    { left: 74, size: 24, duration: 10.5, delay: -7.5, rest: 55 },
    { left: 84, size: 14, duration: 9, delay: -3, rest: 30 },
    { left: 92, size: 28, duration: 13, delay: -10.5, rest: 65 },
    { left: 48, size: 8, duration: 7, delay: -0.5, rest: 50 },
    { left: 12, size: 22, duration: 11.5, delay: -8, rest: 40 },
    { left: 78, size: 8, duration: 7.8, delay: -6.8, rest: 20 },
];

export const MAX_RISING_BUBBLES = BUBBLES.length;

/** Decorative bubble layer for the right side of a hero. Hidden on small screens and from assistive technology. */
export default function RisingBubbles({ count = BUBBLES.length }: Readonly<{ count?: number }>) {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden md:block">
            {BUBBLES.slice(0, count).map((b, i) => (
                <span
                    key={i}
                    className="rise-bubble rise-dot"
                    style={{
                        left: `${b.left}%`,
                        width: b.size,
                        height: b.size,
                        ["--bubble-delay" as string]: `${b.delay}s`,
                        ["--bubble-duration" as string]: `${b.duration}s`,
                        ["--bubble-rest" as string]: `${b.rest}%`,
                    }}
                />
            ))}
        </div>
    );
}
