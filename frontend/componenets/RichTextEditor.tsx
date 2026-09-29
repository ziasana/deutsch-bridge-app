"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { resolveUploadUrlsInHtml, stripBackendOrigin } from "@/lib/backendOrigin";
import { ExamGap, extractGapNumbers } from "@/lib/examGap";
import { FontSize, TextDirection } from "@/lib/tiptapExtensions";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

function ToolbarButton({
    active,
    disabled,
    onClick,
    children,
    title,
}: Readonly<{
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
}>) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`px-2 py-1 rounded text-sm font-medium ${
                active
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            } disabled:opacity-40`}
        >
            {children}
        </button>
    );
}

/**
 * Inserts a File as a base64 image node at the current cursor position - no network upload here.
 * Images stay as base64 while editing (paste from Word/Google Docs already lands as base64 too,
 * with no special handling needed) and are only uploaded once, at save time, by whichever admin
 * page owns the form - see uploadEmbeddedRichTextImages in lib/richTextImages.ts. This means an
 * image never reaches the server, and nothing is ever orphaned there, unless the form is actually
 * submitted.
 */
async function insertImageAsBase64(editor: Editor, file: File) {
    try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
        editor.chain().focus().setImage({ src: dataUrl }).run();
    } catch {
        // Nothing more to do - the file simply won't appear in the editor.
    }
}

/** Inserts a numbered gap marker at the cursor, numbered one past the highest gap already in the doc. */
function insertGapAtCursor(editor: Editor) {
    const existing = extractGapNumbers(editor.getHTML());
    const nextNumber = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    editor.chain().focus().insertContent({ type: "examGap", attrs: { number: nextNumber } }).run();
}

function Toolbar({
    editor,
    onInsertImage,
    allowGapInsertion,
}: Readonly<{ editor: Editor; onInsertImage: () => void; allowGapInsertion?: boolean }>) {
    return (
        <div className="flex flex-wrap gap-1 border-b border-gray-300 dark:border-gray-600 p-1">
            <ToolbarButton
                title="Bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
                title="Italic"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <em>I</em>
            </ToolbarButton>
            <ToolbarButton
                title="Underline"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <span className="underline">U</span>
            </ToolbarButton>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <select
                title="Font size"
                value={editor.getAttributes("textStyle").fontSize ?? ""}
                onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                        editor.chain().focus().setFontSize(value).run();
                    } else {
                        editor.chain().focus().unsetFontSize().run();
                    }
                }}
                className="px-1 py-1 rounded text-sm bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
            >
                <option value="">Default size</option>
                {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                        {size}
                    </option>
                ))}
            </select>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton
                title="Heading"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
                H
            </ToolbarButton>
            <ToolbarButton
                title="Large heading"
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
                H+
            </ToolbarButton>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton
                title="Align left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
                ⯇
            </ToolbarButton>
            <ToolbarButton
                title="Align center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
                ▬
            </ToolbarButton>
            <ToolbarButton
                title="Align right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
                ⯈
            </ToolbarButton>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton
                title="Left-to-right text"
                active={editor.isActive("paragraph", { dir: "ltr" }) || editor.isActive("heading", { dir: "ltr" })}
                onClick={() => editor.chain().focus().setTextDirection("ltr").run()}
            >
                LTR
            </ToolbarButton>
            <ToolbarButton
                title="Right-to-left text"
                active={editor.isActive("paragraph", { dir: "rtl" }) || editor.isActive("heading", { dir: "rtl" })}
                onClick={() => editor.chain().focus().setTextDirection("rtl").run()}
            >
                RTL
            </ToolbarButton>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton
                title="Line break (Shift+Enter)"
                onClick={() => editor.chain().focus().setHardBreak().run()}
            >
                ↵
            </ToolbarButton>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton title="Insert image" onClick={onInsertImage}>
                🖼
            </ToolbarButton>
            {allowGapInsertion && (
                <ToolbarButton title="Insert blank" onClick={() => insertGapAtCursor(editor)}>
                    ▢N
                </ToolbarButton>
            )}
        </div>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
    allowGapInsertion,
}: Readonly<{
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    /** Shows the "insert blank" toolbar button for authoring Sprachbausteine word-bank cloze passages. */
    allowGapInsertion?: boolean;
}>) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2] } }),
            TextAlign.configure({ types: ["paragraph", "heading"] }),
            TextStyle,
            FontSize,
            TextDirection,
            Image.configure({ allowBase64: true, HTMLAttributes: { class: "max-w-full rounded-lg" } }),
            ExamGap,
            Placeholder.configure({ placeholder: placeholder ?? "" }),
        ],
        content: resolveUploadUrlsInHtml(value),
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class:
                    "min-h-[120px] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none [&_p]:my-1 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_p.is-editor-empty:first-child::before]:text-gray-400 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0",
            },
            handlePaste: (_view, event) => {
                const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
                if (files.length > 0 && editor) {
                    event.preventDefault();
                    files.forEach((file) => insertImageAsBase64(editor, file));
                    return true;
                }
                // Otherwise let the browser's normal rich paste run (this is what preserves bold/
                // italic/underline/headings/lists/alignment from the source) - any <img> it embeds
                // inline (e.g. pasting from Word/Google Docs) already lands as base64, same as above.
                return false;
            },
        },
        onUpdate: ({ editor }) => onChange(stripBackendOrigin(editor.getHTML())),
    });

    useEffect(() => {
        if (!editor) return;
        if (value !== stripBackendOrigin(editor.getHTML())) {
            editor.commands.setContent(resolveUploadUrlsInHtml(value), { emitUpdate: false });
        }
        // Only re-syncs when the external value changes out from under us (e.g. loading a
        // different passage into the form) - not on every keystroke, which would fight the cursor.
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden">
            <Toolbar
                editor={editor}
                onInsertImage={() => fileInputRef.current?.click()}
                allowGapInsertion={allowGapInsertion}
            />
            <EditorContent editor={editor} />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) insertImageAsBase64(editor, file);
                }}
            />
        </div>
    );
}
