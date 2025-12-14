'use client';

import {ReactNode, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import AutoRefreshStarter from "@/componenets/AutoRefreshStarter";

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const {
        isLoggedIn,
        hasHydrated,
        sessionExpiresAt,
        refreshSession
    } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isLoggedIn) {
            router.push('/login')
            return;
        }
        if (sessionExpiresAt && Date.now() >= sessionExpiresAt) {
            //get a fresh token
            refreshSession();
        }
    }, [hasHydrated, isLoggedIn, sessionExpiresAt, refreshSession, router]);


    if (!hasHydrated) return null;
    if (!isLoggedIn) return null; // hide protected page while redirecting


    return <>
        {isLoggedIn && <AutoRefreshStarter/> }
        {children}
    </>;
}
