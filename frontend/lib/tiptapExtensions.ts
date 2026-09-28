import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (fontSize: string) => ReturnType;
            unsetFontSize: () => ReturnType;
        };
        textDirection: {
            setTextDirection: (direction: "ltr" | "rtl") => ReturnType;
            unsetTextDirection: () => ReturnType;
        };
    }
}

/**
 * Adds a `fontSize` attribute (rendered as inline `style="font-size: ..."`) to the `textStyle`
 * mark that @tiptap/extension-text-style already provides for `color`/`fontFamily`-style marks.
 * Follows Tiptap's documented "extend textStyle" recipe - there's no official font-size package
 * for this major version.
 */
export const FontSize = Extension.create({
    name: "fontSize",

    addOptions() {
        return { types: ["textStyle"] };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) => element.style.fontSize || null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize:
                (fontSize) =>
                ({ chain }) =>
                    chain().setMark("textStyle", { fontSize }).run(),
            unsetFontSize:
                () =>
                ({ chain }) =>
                    chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
        };
    },
});

/**
 * Adds a `dir` attribute (ltr/rtl) to block nodes, for authoring passages that mix German/English
 * with RTL languages (e.g. Persian/Farsi translations). Mirrors how @tiptap/extension-text-align
 * adds its `textAlign` attribute - there's no official direction extension for this major version.
 */
export const TextDirection = Extension.create({
    name: "textDirection",

    addOptions() {
        return { types: ["paragraph", "heading"] };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    dir: {
                        default: null,
                        parseHTML: (element) => element.getAttribute("dir") || null,
                        renderHTML: (attributes) => {
                            if (!attributes.dir) return {};
                            return { dir: attributes.dir };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setTextDirection:
                (direction) =>
                ({ commands }) =>
                    this.options.types
                        .map((type: string) => commands.updateAttributes(type, { dir: direction }))
                        .every(Boolean),
            unsetTextDirection:
                () =>
                ({ commands }) =>
                    this.options.types
                        .map((type: string) => commands.resetAttributes(type, "dir"))
                        .every(Boolean),
        };
    },
});
