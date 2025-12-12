"use server";

import {loginUser} from "@/services/userService";
import {UserType} from "@/types/user";
type LoginState = {
    success?: boolean;
    data?: any;
    error?: string;
};
export async function loginAction(prevState:LoginState, formData: FormData): Promise<LoginState> {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    // Basic validation
    if (!username || !password) {
        return { error: "Username and password are required" };
    }
    if (password.length < 6) {
        return {error: "Password must be at least 6 characters"};
    }
    const payload: UserType = {
        username: username,
        password: password,
    }

    try {
        // Use await instead of .then
        const response = await loginUser(payload);

        if (response?.status === 200) {
            // return success object directly
            return { success: true, data: response.data };
        } else {
            // backend returned non-200
            return { error: response?.data?.message || "Login failed" };
        }
    } catch (err: any) {
        return { error: err.message || "Server error" };
    }
}