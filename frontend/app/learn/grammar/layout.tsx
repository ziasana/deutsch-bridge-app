import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "German Grammar Lessons",
  description: "Clear German grammar lessons with examples and exercises, organised by topic and level.",
  path: "/learn/grammar",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
