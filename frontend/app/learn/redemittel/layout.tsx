import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "German Redemittel for Exams",
  description: "Essential German Redemittel (speaking and writing phrases) for the telc and DTZ exams, organised by function.",
  path: "/learn/redemittel",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
