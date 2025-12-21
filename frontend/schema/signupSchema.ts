import {z} from 'zod';
export const signupSchema = z.object({
    displayName: z
        .string()
        .min(3, "Full Name must be at least 3 characters long")
        .max(30, "Full Name can not be more then 30 characters long"),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters long'),
    email: z
        .email(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters long'),
    password_confirmation: z
        .string()
        .min(6, "Please confirm your password"),
     })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"], // this sets the error on confirmPassword
    });

export type SignupSchemaFormData = z.infer<typeof signupSchema>;