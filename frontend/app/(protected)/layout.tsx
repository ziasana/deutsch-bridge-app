'use client';

import {ReactNode, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const {
        isLoggedIn,
        hasHydrated,
        userProfile
    } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isLoggedIn && userProfile != null)  {
            router.push('/login')
        }
    }, [hasHydrated, isLoggedIn, router, userProfile]);


    if (!hasHydrated) return null;
    if (!isLoggedIn) return null; // hide protected page while redirecting


    return <>
        {children}
    </>;
}
