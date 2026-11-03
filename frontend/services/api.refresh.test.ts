import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

vi.mock("@/store/useAuthStore", () => ({ default: { getState: () => ({ userProfile: null, logout: vi.fn() }) } }));
vi.mock("@/store/usePremiumUpsellStore", () => ({ default: { getState: () => ({ open: vi.fn() }) } }));

const reply = (config: InternalAxiosRequestConfig, status: number) => {
    const response = { data: {}, status, statusText: "", headers: {}, config };
    return status < 400 ? Promise.resolve(response) : Promise.reject(Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, config, response }));
};

describe("api token refresh", () => {
    let calls: { url: string; at: number }[];
    let cookieFresh: boolean;

    beforeEach(() => {
        vi.resetModules();
        calls = [];
        cookieFresh = false;
    });

    async function load() {
        const { default: api } = await import("./api");
        const adapter: AxiosAdapter = async (config) => {
            const url = config.url ?? "";
            calls.push({ url, at: calls.length });
            if (url.includes("/auth/refresh")) {
                await new Promise((r) => setTimeout(r, 30));
                cookieFresh = true;
                return reply(config, 200);
            }
            // The cookie is only renewed once the refresh has finished.
            return reply(config, cookieFresh ? 200 : 401);
        };
        api.defaults.adapter = adapter;
        return api;
    }

    it("refreshes once for several parallel requests that all got a 401", async () => {
        const api = await load();
        const results = await Promise.all([api.get("/dashboard"), api.get("/user/profile"), api.get("/notifications/unread-count")]);
        expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
        expect(calls.filter((c) => c.url.includes("/auth/refresh"))).toHaveLength(1);
    });

    it("holds a request sent during a refresh until the new cookie is set", async () => {
        const api = await load();
        const first = api.get("/dashboard");
        await new Promise((r) => setTimeout(r, 10));
        const late = api.get("/user/profile");
        expect((await Promise.all([first, late])).map((r) => r.status)).toEqual([200, 200]);
        expect(calls.filter((c) => c.url.includes("/auth/refresh"))).toHaveLength(1);
        // the late request never went out with the stale cookie
        expect(calls.filter((c) => c.url === "/user/profile")).toHaveLength(1);
    });
});
