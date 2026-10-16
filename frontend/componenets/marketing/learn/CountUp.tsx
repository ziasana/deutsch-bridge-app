"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `value` once it scrolls into view; shows the final value straight away for reduced motion. */
export default function CountUp({ value }: Readonly<{ value: number }>) {
    const ref = useRef<HTMLSpanElement>(null);
    const [shown, setShown] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let frame = 0;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            frame = requestAnimationFrame(() => setShown(value));
            return () => cancelAnimationFrame(frame);
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                const start = performance.now();
                const tick = (now: number) => {
                    const t = Math.min((now - start) / 1200, 1);
                    setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
                    if (t < 1) frame = requestAnimationFrame(tick);
                };
                frame = requestAnimationFrame(tick);
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [value]);

    return <span ref={ref}>{shown.toLocaleString()}</span>;
}
