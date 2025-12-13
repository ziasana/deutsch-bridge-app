"use client";

import {ToastContainer} from "react-toastify";
import * as React from "react";
import useAuthStore from "@/store/useAuthStore";

export default function VocabularyPage() {
    const {user} = useAuthStore();
    return (
        <div>
            <div>
                <h1>Welcome, {user?.username}</h1>
            </div>
            <ToastContainer/>
            <h1>Vocabulary</h1>
        </div>

    );
}