import { resolveUploadUrl } from "@/lib/backendOrigin";

/** Absolute src for a post's uploaded cover, or null when it has none (callers render a gradient placeholder). */
export function getBlogImageSrc(imageUrl: string | null | undefined): string | null {
    // Starter covers ship with the frontend (public/blog-covers); admin uploads live on the backend under /uploads.
    if (imageUrl?.startsWith("/blog-covers/")) return imageUrl;
    return resolveUploadUrl(imageUrl);
}

export function formatBlogDate(iso: string | null | undefined, language: "en" | "fa"): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(language === "fa" ? "fa-IR" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function authorInitial(name: string | null | undefined): string {
    return (name?.trim()[0] ?? "D").toUpperCase();
}
