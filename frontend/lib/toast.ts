import type { ReactNode } from "react";
import { toast as reactToastify, type ToastOptions } from "react-toastify";

/**
 * Single entry point for toasts across the app - wraps react-toastify so every call site shares
 * the same library, options and (via globals.css's --toastify-* overrides) visual theme. Import
 * this instead of "react-toastify"/"sonner" directly, and render <ToastContainer /> only once,
 * globally, in app/layout.tsx.
 */
export const toast = {
    success: (message: ReactNode, options?: ToastOptions) => reactToastify.success(message, options),
    error: (message: ReactNode, options?: ToastOptions) => reactToastify.error(message, options),
    info: (message: ReactNode, options?: ToastOptions) => reactToastify.info(message, options),
};
