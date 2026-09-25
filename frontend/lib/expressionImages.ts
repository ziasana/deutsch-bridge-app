import { BACKEND_ORIGIN } from "@/lib/backendOrigin";

/** Resolves an admin-uploaded expression illustration (served by the backend under /uploads). */
export function getExpressionImageSrc(imageUrl: string | null | undefined): string | null {
    return imageUrl ? `${BACKEND_ORIGIN}${imageUrl}` : null;
}
