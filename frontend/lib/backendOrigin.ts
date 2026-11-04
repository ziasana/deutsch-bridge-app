// NEXT_PUBLIC_* is baked into the client bundle at build time, so NEXT_PUBLIC_BACKEND_URL must be set in the
// environment the build runs in (e.g. Vercel's project settings). The server also reads it for metadata and the sitemap.
export const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

/** Resolves a backend-relative "/uploads/..." path to an absolute URL. Already-absolute URLs pass through untouched. */
export function resolveUploadUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return /^https?:\/\//.test(url) ? url : `${BACKEND_ORIGIN}${url}`;
}

/** Rewrites every relative "/uploads/..." src inside a stored HTML fragment to an absolute URL, for display. */
export function resolveUploadUrlsInHtml(html: string): string {
    return html.replace(/src="(\/uploads\/[^"]*)"/g, (_match, path: string) => `src="${BACKEND_ORIGIN}${path}"`);
}

/** Inverse of resolveUploadUrlsInHtml - strips the backend origin back off before persisting edited HTML. */
export function stripBackendOrigin(html: string): string {
    return html.split(BACKEND_ORIGIN).join("");
}
