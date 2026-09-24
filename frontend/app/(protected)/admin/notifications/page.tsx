"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The "Notifications" admin link lands here; forward to the List tab (compose + broadcast history). */
export default function AdminNotificationsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/notifications/list");
    }, [router]);

    return null;
}
