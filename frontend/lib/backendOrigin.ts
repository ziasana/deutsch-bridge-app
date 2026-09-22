export const BACKEND_ORIGIN = "http://localhost:8080";

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
