/**
 * Scans a RichTextEditor-authored HTML fragment for base64 data-URL <img> tags (how every image
 * lands while editing - see RichTextEditor/insertImageAsBase64) and uploads each one, replacing
 * its src with the real backend-relative URL. Call this once per HTML field, right before a form
 * actually submits, so an image only ever reaches the server - and only ever risks becoming an
 * orphaned file - when the form it belongs to is genuinely saved.
 */
export async function uploadEmbeddedRichTextImages(
    html: string,
    onUploadImage: (file: File) => Promise<string>
): Promise<string> {
    if (typeof window === "undefined" || !html || !html.includes("data:")) return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const images = Array.from(doc.querySelectorAll("img")).filter((img) => img.getAttribute("src")?.startsWith("data:"));

    for (const img of images) {
        try {
            const src = img.getAttribute("src") ?? "";
            const blob = await (await fetch(src)).blob();
            const file = new File([blob], "embedded-image", { type: blob.type || "image/png" });
            const url = await onUploadImage(file);
            img.setAttribute("src", url);
        } catch {
            // Leave this particular image as base64 on upload failure, rather than losing it.
        }
    }

    return doc.body.innerHTML;
}
