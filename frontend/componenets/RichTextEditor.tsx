"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

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

function Toolbar({ editor }: Readonly<{ editor: Editor }>) {
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
        </div>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
}: Readonly<{
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}>) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            TextAlign.configure({ types: ["paragraph"] }),
            Placeholder.configure({ placeholder: placeholder ?? "" }),
        ],
        content: value,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class:
                    "min-h-[120px] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none [&_p]:my-1 [&_p.is-editor-empty:first-child::before]:text-gray-400 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0",
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
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
