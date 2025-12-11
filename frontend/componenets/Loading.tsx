"use client";

// components/Loading.tsx
import React from "react";

type LoadingProps = {
    message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 pointer-events-none">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
                {message && <p className="mt-2 text-white font-medium">{message}</p>}
            </div>
        </div>
    );
};

export default Loading;

