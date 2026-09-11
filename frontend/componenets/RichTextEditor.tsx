"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";

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

/** Uploads a single File and inserts it as an image node at the current cursor position. */
async function insertUploadedImage(editor: Editor, file: File, onUploadImage: (file: File) => Promise<string>) {
    try {
        const url = await onUploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
    } catch {
        // Upload failures are surfaced by onUploadImage's own caller (e.g. a toast) - nothing more to do here.
    }
}

/**
 * Replaces any base64-embedded <img> the browser pasted inline (common when pasting from Word/
 * Google Docs) with an uploaded, URL-backed image, so the stored HTML stays small and consistent
 * with every other image in the app. Attribute-only edits don't change node sizes, so positions
 * gathered up front stay valid across the sequential replacements below.
 */
async function uploadEmbeddedImages(editor: Editor, onUploadImage: (file: File) => Promise<string>) {
    const targets: { pos: number; src: string }[] = [];
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && typeof node.attrs.src === "string" && node.attrs.src.startsWith("data:")) {
            targets.push({ pos, src: node.attrs.src });
        }
    });

    for (const { pos, src } of targets) {
        try {
            const blob = await (await fetch(src)).blob();
            const file = new File([blob], "pasted-image", { type: blob.type || "image/png" });
            const url = await onUploadImage(file);
            editor.commands.command(({ tr }) => {
                const node = tr.doc.nodeAt(pos);
                if (!node) return false;
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url });
                return true;
            });
        } catch {
            // Leave this particular embedded image as a base64 data URL if the upload fails.
        }
    }
}

function Toolbar({
    editor,
    onInsertImage,
}: Readonly<{ editor: Editor; onInsertImage: () => void }>) {
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
            <ToolbarButton title="Insert image" onClick={onInsertImage}>
                🖼
            </ToolbarButton>
        </div>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
    onUploadImage,
}: Readonly<{
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    /** Uploads a file and resolves to its served URL - used for both the toolbar button and pasted images. */
    onUploadImage: (file: File) => Promise<string>;
}>) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2] } }),
            Underline,
            TextAlign.configure({ types: ["paragraph", "heading"] }),
            Image.configure({ allowBase64: true, HTMLAttributes: { class: "max-w-full rounded-lg" } }),
            Placeholder.configure({ placeholder: placeholder ?? "" }),
        ],
        content: value,
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
                    files.forEach((file) => insertUploadedImage(editor, file, onUploadImage));
                    return true;
                }
                // Otherwise let the browser's normal rich paste run (this is what preserves bold/
                // italic/underline/headings/lists/alignment from the source), then sweep for any
                // base64 <img> tags it embedded and swap them for uploaded, URL-backed images.
                if (editor) {
                    setTimeout(() => uploadEmbeddedImages(editor, onUploadImage), 0);
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    useEffect(() => {
        if (!editor) return;
        if (value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
        // Only re-syncs when the external value changes out from under us (e.g. loading a
        // different passage into the form) - not on every keystroke, which would fight the cursor.
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden">
            <Toolbar editor={editor} onInsertImage={() => fileInputRef.current?.click()} />
            <EditorContent editor={editor} />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) insertUploadedImage(editor, file, onUploadImage);
                }}
            />
        </div>
    );
}
