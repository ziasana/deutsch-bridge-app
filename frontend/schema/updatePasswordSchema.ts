import {z} from "zod";

export const updatePasswordSchema= z
    .object(
        {
            currentPassword: z
                .string()
                .min(1, "Enter your current password"),
            password: z
                .string()
                .min(1, "Please enter a new password")
                .min(6, "Password must be at least 6 characters")
                .max(20, "Password must not be more than 20 characters"),
            password_confirmation: z
                .string()
                .min(1, "Please confirm your password"),
        })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"], // this sets the error on confirmPassword
    });


export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;