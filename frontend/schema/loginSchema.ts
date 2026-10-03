import {z} from 'zod';
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Please enter your email address')
        .pipe(z.email('Enter a valid email address, e.g. name@example.com')),
    password: z
        .string()
        .min(1, 'Please enter your password')
        .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;