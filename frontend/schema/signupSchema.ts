import {z} from 'zod';
export const signupSchema = z.object({
    displayName: z
        .string()
        .min(1, "Please enter your full name")
        .min(3, "Full Name must be at least 3 characters long")
        .max(30, "Full Name can not be more then 30 characters long"),
    username: z
        .string()
        .min(1, "Please choose a username")
        .min(3, 'Username must be at least 3 characters long'),
    email: z
        .string()
        .min(1, 'Please enter your email address')
        .pipe(z.email('Enter a valid email address, e.g. name@example.com')),
    password: z
        .string()
        .min(1, "Please enter a password")
        .min(6, 'Password must be at least 6 characters long'),
    password_confirmation: z
        .string()
        .min(1, "Please confirm your password"),
     })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"], // this sets the error on confirmPassword
    });

export type SignupSchemaFormData = z.infer<typeof signupSchema>;