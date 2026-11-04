import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "German Reading Practice",
  description: "Read graded German articles from A1 to C2 with vocabulary support to improve your reading skills.",
  path: "/learn/reading",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
