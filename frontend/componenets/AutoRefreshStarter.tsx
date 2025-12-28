"use client";

import { useEffect } from "react";
import { startSimpleRefresh } from "@/lib/tokenRefresher";

export default function AutoRefreshStarter() {
    useEffect(() => {
        startSimpleRefresh();
    }, []);

    return null;
}
