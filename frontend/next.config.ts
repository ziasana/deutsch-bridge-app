import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    images: {
        domains: ['images.unsplash.com'], // Add your external host here
    },
  /* config options here */
   /* async rewrites() {
        return [
            {
                source: "/api/:path*",       // frontend URL
                destination: "http://localhost:8080/api/:path*", // backend URL
            }
        ];
    },*/
};

export default nextConfig;
