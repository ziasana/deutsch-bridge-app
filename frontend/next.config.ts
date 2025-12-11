import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
    async rewrites() {
        return [
            {
                source: "/api/:path*",       // frontend URL
                destination: "http://localhost:8080/api/:path*", // backend URL
            }
        ];
    },
};

export default nextConfig;
