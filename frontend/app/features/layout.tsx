import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Features",
  description: "Everything DeutschCertify offers: mock exams, grammar lessons, reading practice, speaking and writing guides, and AI feedback for German exam preparation.",
  path: "/features",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
