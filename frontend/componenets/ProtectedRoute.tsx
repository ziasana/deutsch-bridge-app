'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
    const isAuthenticated = useAuthStore((state) => state.isLoggedIn);
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null; // or loading spinner
    }

    return <>{children}</>;
}