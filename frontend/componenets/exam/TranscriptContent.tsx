"use client";

import { Fragment, useMemo } from "react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { formatTranscript, isHtmlTranscript } from "@/lib/transcriptFormat";

/**
 * Renders one transcript. Rich text (HTML from the admin editor) is shown as authored; older plain
 * text is split into readable paragraphs. "document" is the roomy reading view used in the modal,
 * "compact" fits inside a per-question feedback card.
 */
export default function TranscriptContent({
    transcript,
    variant = "document",
}: Readonly<{ transcript: string; variant?: "document" | "compact" }>) {
    const html = isHtmlTranscript(transcript);
    const paragraphs = useMemo(() => (html ? [] : formatTranscript(transcript)), [html, transcript]);

    if (html) {
        return (
            <LessonMarkdown
                content={transcript}
                className={
                    variant === "document"
                        ? "!space-y-0 text-base !leading-[1.8] [&_p]:!my-0 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_h2]:!mt-6 [&_h3]:!mt-5 [&_li]:!my-1 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg"
                        : "text-sm font-normal [&_img]:max-w-full"
                }
            />
        );
    }

    return (
        <div className={variant === "document" ? "text-base leading-[1.8]" : "text-sm font-normal space-y-2"}>
            {paragraphs.map((lines, pIdx) => (
                <p key={pIdx} className={variant === "document" ? "mb-5 last:mb-0" : ""}>
                    {lines.map((line, lIdx) => (
                        <Fragment key={lIdx}>
                            {lIdx > 0 && <br />}
                            {line}
                        </Fragment>
                    ))}
                </p>
            ))}
        </div>
    );
}
