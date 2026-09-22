const BACKEND_ORIGIN = "http://localhost:8080";

/** Resolves an admin-uploaded expression illustration (served by the backend under /uploads). */
export function getExpressionImageSrc(imageUrl: string | null | undefined): string | null {
    return imageUrl ? `${BACKEND_ORIGIN}${imageUrl}` : null;
}
