import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Learn German Online",
  description: "Browse free German reading articles, grammar lessons, useful expressions and Redemittel to build your skills for the exam.",
  path: "/learn",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
