"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Exam-prep management is now split by section (see the sidebar's "Manage Exam Prep" submenu). */
export default function AdminExamPrepIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/exam-prep/leseverstehen");
    }, [router]);

    return null;
}
