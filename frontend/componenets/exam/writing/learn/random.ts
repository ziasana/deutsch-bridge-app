/** Small seeded PRNG so "random" quiz content is stable across renders (and pure, so it is safe to use while rendering). */
export function seededRandom(seed: string): () => number {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/** A shuffle that is guaranteed to differ from the input order (when there is more than one distinct item). */
export function shuffledDifferent<T>(items: readonly T[], rand: () => number): T[] {
    if (new Set(items).size < 2) return [...items];
    for (let i = 0; i < 10; i++) {
        const s = shuffled(items, rand);
        if (s.some((x, idx) => x !== items[idx])) return s;
    }
    return [...items].reverse();
}
