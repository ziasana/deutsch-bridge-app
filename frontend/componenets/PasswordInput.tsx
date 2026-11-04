"use client";

import { ComponentProps, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "@/componenets/Input";

type Props = Omit<ComponentProps<typeof Input>, "type"> & {
    /** Controlled visibility, so several fields (password and confirmation) can share one toggle. */
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
};

/** A password field with a show/hide button, so people can check what they typed. */
export default function PasswordInput({ visible, onVisibleChange, style, ...rest }: Readonly<Props>) {
    const [innerVisible, setInnerVisible] = useState(false);
    const show = visible ?? innerVisible;
    const toggle = () => (onVisibleChange ?? setInnerVisible)(!show);

    return (
        <div className="relative">
            <Input {...rest} type={show ? "text" : "password"} style={{ paddingInlineEnd: "2.75rem", ...style }} />
            <button
                type="button"
                onClick={toggle}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute end-2 top-[calc(50%+4px)] flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-foreground/50 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
        </div>
    );
}
