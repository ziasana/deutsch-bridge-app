import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Useful German Expressions",
  description: "Learn everyday German expressions and idioms with meanings and examples to sound natural.",
  path: "/learn/expressions",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
