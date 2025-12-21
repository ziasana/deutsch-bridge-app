// lib/simpleTokenRefresher.ts
let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startSimpleRefresh() {
    if (refreshInterval) return;

    console.log("✅ startSimpleRefresh called");

    refreshInterval = setInterval(() => {
        console.log("⏱ refresh timer fired:", new Date());

        fetch("http://localhost:8080/api/auth/refresh", {
            method: "GET",
            credentials: "include",
        })
            .then(res => console.log("refresh response:", res.status))
            .catch(err => console.error("refresh error:", err));
    }, 12 * 60 * 1000); // ⬅️ TEMP: 15 minute for testing
}
