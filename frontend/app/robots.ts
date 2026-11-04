import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";


export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/admin",
        "/profile",
        "/premium",
        "/notifications",
        "/user-progress",
        "/login",
        "/signup",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
