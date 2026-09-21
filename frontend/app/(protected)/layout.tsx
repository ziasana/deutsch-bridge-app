'use client';

import {ReactNode, useEffect, useRef} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { getUserProfile } from '@/services/userService';
interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const {
        isLoggedIn,
        hasHydrated,
        userProfile,
        updateUserProfile,
    } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const hasRefreshedProfile = useRef(false);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isLoggedIn && userProfile != null)  {
            router.push('/login')
        }
    }, [hasHydrated, isLoggedIn, router, userProfile]);

    useEffect(() => {
        if (!hasHydrated || !isLoggedIn || !userProfile) return;
        if (userProfile.role === 'ADMIN') return;
        if (!userProfile.onboardingCompleted) {
            router.push('/signup/onboarding');
        }
    }, [hasHydrated, isLoggedIn, userProfile, pathname, router]);

    useEffect(() => {
        if (!hasHydrated || !isLoggedIn || hasRefreshedProfile.current) return;
        hasRefreshedProfile.current = true;
        // The persisted profile can be stale (e.g. saved before the user set their learning level
        // in a later session), so refresh it once from the server whenever the protected area mounts.
        getUserProfile()
            .then((res) => updateUserProfile(res.data.data))
            .catch(() => {
                // Non-fatal: fall back to the persisted profile already in the store.
            });
    }, [hasHydrated, isLoggedIn, updateUserProfile]);


    if (!hasHydrated) return null;
    if (!isLoggedIn) return null; // hide protected page while redirecting


    return <>
        {children}
    </>;
}
