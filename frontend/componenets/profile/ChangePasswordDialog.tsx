"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, X } from "lucide-react";
import { updatePassword } from "@/services/userService";
import { toast } from "@/lib/toast";
import { UpdatePasswordFormData, updatePasswordSchema } from "@/schema/updatePasswordSchema";
import { cn } from "@/lib/utils";

interface Props {
    open: boolean;
    onClose: () => void;
}

type FieldName = "currentPassword" | "password" | "password_confirmation";

const FIELDS: { name: FieldName; label: string; autoComplete: string }[] = [
    { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
    { name: "password", label: "New password", autoComplete: "new-password" },
    { name: "password_confirmation", label: "Confirm new password", autoComplete: "new-password" },
];

const fieldClass = "w-full rounded-lg border bg-background px-3.5 py-2 pe-10 text-sm text-foreground outline-none transition focus:ring-2 disabled:opacity-60";

/**
 * "Update password" as a small modal, opened from the user menu. It asks for the current password first, so a borrowed
 * session cannot lock the owner out, then the new one twice. Closes itself once the password is saved.
 */
export default function ChangePasswordDialog({ open, onClose }: Readonly<Props>) {
    const [saving, setSaving] = useState(false);
    const [show, setShow] = useState(false);
    const firstField = useRef<HTMLInputElement | null>(null);

    const {
        reset,
        register,
        setError,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdatePasswordFormData>({ resolver: zodResolver(updatePasswordSchema), mode: "onSubmit" });

    const close = () => {
        if (saving) return;
        reset();
        setShow(false);
        onClose();
    };

    useEffect(() => {
        if (!open) return;
        firstField.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) {
                reset();
                setShow(false);
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, saving, onClose, reset]);

    if (!open || typeof document === "undefined") return null;

    const onSubmit = (data: UpdatePasswordFormData) => {
        setSaving(true);
        updatePassword({ currentPassword: data.currentPassword, password: data.password })
            .then((res) => {
                if (res?.status == 200) {
                    toast.success("Password updated!");
                    reset();
                    setShow(false);
                    onClose();
                }
            })
            .catch((err) => {
                const message: string = err?.response?.data?.message ?? "Couldn't update your password.";
                // A wrong current password belongs under that field; anything else is a general error.
                if (/current password/i.test(message)) setError("currentPassword", { message });
                else toast.error(message);
            })
            .finally(() => setSaving(false));
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={close}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
                className="anim-pop w-full max-w-md rounded-[10px] bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
                    <div>
                        <h2 id="change-password-title" className="text-base font-semibold text-foreground">
                            Update password
                        </h2>
                        <p className="mt-0.5 text-sm text-foreground/60">Enter your current password, then choose a new one (6 to 20 characters).</p>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close"
                        className="-me-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="space-y-4 px-6 py-5">
                        {FIELDS.map((f, i) => {
                            const error = errors[f.name]?.message;
                            const { ref, ...field } = register(f.name);
                            return (
                                <div key={f.name}>
                                    <label htmlFor={`pw-${f.name}`} className="block text-sm font-medium text-foreground">
                                        {f.label}
                                    </label>
                                    <div className="relative mt-1.5">
                                        <input
                                            id={`pw-${f.name}`}
                                            type={show ? "text" : "password"}
                                            autoComplete={f.autoComplete}
                                            aria-invalid={Boolean(error)}
                                            disabled={saving}
                                            className={cn(fieldClass, error ? "border-red-500 focus:ring-red-500/30" : "border-border focus:border-primary focus:ring-primary/30")}
                                            {...field}
                                            ref={(el) => {
                                                ref(el);
                                                if (i === 0) firstField.current = el;
                                            }}
                                        />
                                        {i === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShow((v) => !v)}
                                                aria-label={show ? "Hide passwords" : "Show passwords"}
                                                className="absolute end-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-foreground/45 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                            >
                                                {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                                            </button>
                                        )}
                                    </div>
                                    {error && (
                                        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
                        <button
                            type="button"
                            onClick={close}
                            disabled={saving}
                            className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/70 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Update password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
