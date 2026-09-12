const BACKEND_ORIGIN = "http://localhost:8080";

const DEFAULT_IMAGE_BY_LEVEL: Record<string, string> = {
    A1: "/reading-defaults/a1.svg",
    A2: "/reading-defaults/a2.svg",
    B1: "/reading-defaults/b1.svg",
    B2: "/reading-defaults/b2.svg",
    C1: "/reading-defaults/c1.svg",
    C2: "/reading-defaults/c2.svg",
};

/**
 * Resolves the image to show for a reading article: the admin-uploaded one (served by the
 * backend under /uploads) if present, otherwise a level-themed default bundled with the frontend.
 */
export function getArticleImageSrc(imageUrl: string | null | undefined, level: string | null | undefined): string {
    if (imageUrl) return `${BACKEND_ORIGIN}${imageUrl}`;
    return DEFAULT_IMAGE_BY_LEVEL[level ?? ""] ?? DEFAULT_IMAGE_BY_LEVEL.A1;
}
