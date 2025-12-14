"use server";

import {loginUser} from "@/services/userService";
import {UserType} from "@/types/user";

import { cookies } from 'next/headers'
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

   /* try {
        //const cookieStore = await cookies()

        const response = await fetch("http://localhost:8080/api/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // important for HttpOnly cookies
            body: JSON.stringify({ username, password }),
        });

        // parse JSON body
        const data = await response.json();

        if (response.ok) { // same as response.status >= 200 && < 300
            //cookieStore.set('my data ', 'lee')

            return { success: true, data };
        } else {
            return { error: data?.message || "Login failed" };
        }
    } catch (err: any) {
        return { error: err.message || "Server error" };
    }*/
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