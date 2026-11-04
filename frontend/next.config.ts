import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    // Old query-string URLs (already shared or indexed) now live at path URLs.
    async redirects() {
        return [
            { source: "/blog/post", has: [{ type: "query", key: "slug", value: "(?<slug>.+)" }], destination: "/blog/:slug", permanent: true },
            { source: "/learn/reading/article", has: [{ type: "query", key: "id", value: "(?<id>.+)" }], destination: "/learn/reading/:id", permanent: true },
            { source: "/learn/grammar/lesson", has: [{ type: "query", key: "id", value: "(?<id>.+)" }], destination: "/learn/grammar/:id", permanent: true },
        ];
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
        ],
    },

};

export default nextConfig;
