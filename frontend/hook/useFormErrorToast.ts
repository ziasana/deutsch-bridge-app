import { useEffect } from "react";
import { toast } from "react-toastify";

export function useFormErrorToast(
    errors: Record<string, any>,
    isSubmitted: boolean
) {
    useEffect(() => {
        if (!isSubmitted) return;

        for (const key in errors) {
            const error = errors[key];
            if (error?.message) {
                toast.error(error.message);
            }
        }
    }, [errors, isSubmitted]);
}
