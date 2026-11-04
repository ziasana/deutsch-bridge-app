import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "German Learning Blog",
  description: "Tips, exam strategies and guides for learning German effectively and passing your telc or DTZ exam.",
  path: "/blog",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
