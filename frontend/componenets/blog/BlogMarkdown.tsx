"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveUploadUrl } from "@/lib/backendOrigin";

/**
 * Typography for blog post bodies. Deliberately does NOT enable raw HTML (no rehype-raw): posts are
 * public, so Markdown is the only markup an author can produce - react-markdown escapes the rest.
 */
const proseClassNames =
    "text-[1.0625rem] leading-8 text-foreground/85 " +
    "[&>*+*]:mt-5 " +
    "[&_h1]:mt-12 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-foreground " +
    "[&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:leading-snug " +
    "[&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground " +
    "[&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic " +
    "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:opacity-80 " +
    "[&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1.5 [&_li::marker]:text-primary " +
    "[&_blockquote]:rounded-r-2xl [&_blockquote]:border-s-4 [&_blockquote]:border-primary [&_blockquote]:bg-accent/60 " +
    "[&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:text-lg [&_blockquote]:italic [&_blockquote]:text-foreground/80 " +
    "[&_blockquote_p]:m-0 " +
    "[&_hr]:my-10 [&_hr]:border-border " +
    "[&_code]:rounded-md [&_code]:bg-accent [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-accent-foreground " +
    "[&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#0d0d21] [&_pre]:p-5 [&_pre]:text-sm [&_pre]:text-slate-200 " +
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit " +
    "[&_img]:mx-auto [&_img]:rounded-2xl [&_img]:shadow-card " +
    "[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-base " +
    "[&_th]:border [&_th]:border-border [&_th]:bg-accent [&_th]:px-4 [&_th]:py-2 [&_th]:text-start " +
    "[&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2";

export default function BlogMarkdown({ content, className = "" }: Readonly<{ content: string; className?: string }>) {
    return (
        <div className={`${proseClassNames} ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children }) => {
                        const external = /^https?:\/\//.test(href ?? "");
                        return (
                            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                                {children}
                            </a>
                        );
                    },
                    // eslint-disable-next-line @next/next/no-img-element
                    img: ({ src, alt }) => <img src={resolveUploadUrl(typeof src === "string" ? src : null) ?? ""} alt={alt ?? ""} loading="lazy" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
