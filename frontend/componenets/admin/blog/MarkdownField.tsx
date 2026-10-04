"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";
import BlogMarkdown from "@/componenets/blog/BlogMarkdown";

interface MarkdownFieldProps {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
}

type Tab = "write" | "preview";
type ToolId = "heading" | "bold" | "italic" | "link" | "ul" | "ol" | "quote";

const TOOLS: { id: ToolId; title: string; icon: typeof Bold }[] = [
    { id: "heading", title: "Heading", icon: Heading2 },
    { id: "bold", title: "Bold", icon: Bold },
    { id: "italic", title: "Italic", icon: Italic },
    { id: "link", title: "Link", icon: Link2 },
    { id: "ul", title: "Bulleted list", icon: List },
    { id: "ol", title: "Numbered list", icon: ListOrdered },
    { id: "quote", title: "Quote", icon: Quote },
];

/** Markdown textarea with a small formatting toolbar and a live preview that uses the exact public renderer. */
export default function MarkdownField({ value, onChange, rows = 16 }: Readonly<MarkdownFieldProps>) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<Tab>("write");

    /** Wraps the selection (or inserts `placeholder`) between `before`/`after`, then restores the selection. */
    const wrap = (before: string, after = before, placeholder = "text") => {
        const el = ref.current;
        if (!el) return;
        const { selectionStart: start, selectionEnd: end } = el;
        const selected = value.slice(start, end) || placeholder;
        onChange(value.slice(0, start) + before + selected + after + value.slice(end));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + before.length, start + before.length + selected.length);
        });
    };

    /** Prefixes every selected line (or the current one) with `prefix`; `numbered` counts 1., 2., ... */
    const prefixLines = (prefix: string, numbered = false) => {
        const el = ref.current;
        if (!el) return;
        const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
        const nextBreak = value.indexOf("\n", el.selectionEnd);
        const lineEnd = nextBreak === -1 ? value.length : nextBreak;
        const block = value
            .slice(lineStart, lineEnd)
            .split("\n")
            .map((line, i) => `${numbered ? `${i + 1}. ` : prefix}${line}`)
            .join("\n");
        onChange(value.slice(0, lineStart) + block + value.slice(lineEnd));
        requestAnimationFrame(() => el.focus());
    };

    const runTool = (id: ToolId) => {
        switch (id) {
            case "heading": return prefixLines("## ");
            case "bold": return wrap("**");
            case "italic": return wrap("*");
            case "link": return wrap("[", "](https://)", "link text");
            case "ul": return prefixLines("- ");
            case "ol": return prefixLines("", true);
            case "quote": return prefixLines("> ");
        }
    };

    return (
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 px-2 py-1.5">
                <div className="flex items-center gap-0.5">
                    {TOOLS.map(({ id, title, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            title={title}
                            aria-label={title}
                            disabled={tab === "preview"}
                            onClick={() => runTool(id)}
                            className="p-1.5 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40"
                        >
                            <Icon className="size-4" />
                        </button>
                    ))}
                </div>
                <div className="flex rounded-md bg-gray-200 dark:bg-gray-800 p-0.5 text-xs font-medium">
                    {(["write", "preview"] as const).map((name) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => setTab(name)}
                            className={`px-3 py-1 rounded capitalize ${
                                tab === name
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-300"
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {tab === "write" ? (
                <textarea
                    ref={ref}
                    value={value}
                    rows={rows}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Write your article in Markdown…"
                    className="block w-full resize-y bg-gray-50 dark:bg-gray-700 px-4 py-3 font-mono text-sm text-gray-900 dark:text-white focus:outline-none"
                />
            ) : (
                <div className="bg-background px-6 py-5 min-h-[20rem]">
                    {value.trim() ? (
                        <BlogMarkdown content={value} />
                    ) : (
                        <p className="text-sm text-gray-500">Nothing to preview yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
