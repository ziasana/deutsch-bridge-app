'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const isAuthenticated = useAuthStore((state) => state.isLoggedIn);
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null; // or a loading spinner
    }

    return <>{children}</>;
}
