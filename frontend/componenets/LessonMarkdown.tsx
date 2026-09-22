"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { resolveUploadUrlsInHtml } from "@/lib/backendOrigin";
import { normalizeLessonMarkdown } from "@/lib/markdownNormalize";

export const markdownClassNames =
    "space-y-3 leading-relaxed " +
    "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 " +
    "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 " +
    "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 " +
    "[&_p]:my-1 [&_strong]:font-semibold [&_em]:italic " +
    "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-0.5 " +
    "[&_hr]:my-4 [&_hr]:border-gray-200 dark:[&_hr]:border-gray-600 " +
    "[&_table]:w-full [&_table]:my-3 [&_table]:border-collapse " +
    "[&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-gray-600 [&_th]:bg-gray-100 dark:[&_th]:bg-gray-700 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left " +
    "[&_td]:border [&_td]:border-gray-300 dark:[&_td]:border-gray-600 [&_td]:px-3 [&_td]:py-1.5 " +
    "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 dark:[&_blockquote]:border-blue-700 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 dark:[&_blockquote]:text-gray-400 " +
    "[&_code]:bg-gray-100 dark:[&_code]:bg-gray-700 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm";

const inlineClassNames = "[&_strong]:font-semibold [&_em]:italic [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:rounded [&_code]:px-1";

/** Renders a single line of markdown (question text, option labels, answer keys) without
 * paragraph/heading block spacing - just inline emphasis, bold and inline code.
 * `autoDir`: opt-in per-instance German/Persian detection (see autoDirStyle below) - a
 * German-only line renders ltr and left-aligned instead of inheriting the surrounding RTL
 * container; a Persian line (with German words possibly embedded inline) is left untouched. Off
 * by default so existing callers keep their current behavior unless they explicitly opt in. */
export function InlineMarkdown({
    content,
    className = "",
    autoDir = false,
}: {
    content: string;
    className?: string;
    autoDir?: boolean;
}) {
    const dirStyle = autoDir ? autoDirStyle({ type: "text", value: content }) : {};
    return (
        <span className={`${inlineClassNames} ${className}`} {...dirStyle}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{ p: ({ children }) => <>{children}</> }}
            >
                {resolveUploadUrlsInHtml(content)}
            </ReactMarkdown>
        </span>
    );
}

interface HastNode {
    type?: string;
    value?: string;
    children?: HastNode[];
}

/** Flattens a hast (markdown AST) node down to its plain text, to sniff its language/direction. */
function collectText(node: HastNode | undefined): string {
    if (!node) return "";
    if (node.type === "text") return node.value ?? "";
    if (Array.isArray(node.children)) return node.children.map(collectText).join("");
    return "";
}

// Persian/Arabic/Hebrew script ranges vs. Latin (incl. German umlauts/ss) - checked character by
// character so the FIRST strong-directional character found wins, same rule browsers use for
// dir="auto". Digits, punctuation and emoji are direction-neutral and get skipped over.
const RTL_CHAR = new RegExp("[\\u0590-\\u08FF\\uFB1D-\\uFDFF\\uFE70-\\uFEFF]");
const LTR_CHAR = new RegExp("[A-Za-z\\u00C0-\\u024F]");

function detectDir(text: string): "ltr" | "rtl" {
    for (const ch of text) {
        if (RTL_CHAR.test(ch)) return "rtl";
        if (LTR_CHAR.test(ch)) return "ltr";
    }
    return "rtl";
}

/** Resolves the {dir, textAlign} pair for a block's detected direction - a German-only block
 * (e.g. "Ich lerne Deutsch.") flips to ltr AND left-aligned, so it reads like a normal German
 * list/sentence instead of bidi-ordered-but-still-right-aligned. A line that mixes Persian with
 * embedded German words (e.g. an inline "Sie" inside a Persian sentence) starts with a Persian
 * character, so detectDir reports "rtl" and the block is left completely untouched - the same
 * per-block auto-detection idea as dir="auto", computed ourselves because the browser's own
 * dir="auto" flips reading order but not reliably text-align. */
function autoDirStyle(node: HastNode | undefined) {
    const dir = detectDir(collectText(node));
    return { dir, style: { textAlign: dir === "ltr" ? ("left" as const) : ("right" as const) } };
}

// react-markdown passes an extra `node` (the hast AST node) prop to custom component overrides;
// it's used above for the text sniff and must not be spread onto the DOM element itself.
const autoDirComponents = {
    p: ({ node, ...props }: ComponentPropsWithoutRef<"p"> & { node?: HastNode }) => <p {...autoDirStyle(node)} {...props} />,
    li: ({ node, ...props }: ComponentPropsWithoutRef<"li"> & { node?: HastNode }) => <li {...autoDirStyle(node)} {...props} />,
    td: ({ node, ...props }: ComponentPropsWithoutRef<"td"> & { node?: HastNode }) => <td {...autoDirStyle(node)} {...props} />,
    th: ({ node, ...props }: ComponentPropsWithoutRef<"th"> & { node?: HastNode }) => <th {...autoDirStyle(node)} {...props} />,
    blockquote: ({ node, ...props }: ComponentPropsWithoutRef<"blockquote"> & { node?: HastNode }) => (
        <blockquote {...autoDirStyle(node)} {...props} />
    ),
};

export default function LessonMarkdown({ content, className = "" }: { content: string; className?: string }) {
    return (
        <div className={`${markdownClassNames} ${className}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={autoDirComponents}>
                {normalizeLessonMarkdown(resolveUploadUrlsInHtml(content))}
            </ReactMarkdown>
        </div>
    );
}
