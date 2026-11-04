import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "telc German Exam Preparation",
  description: "Prepare for the telc German exam with realistic mock tests, reading, listening, writing and speaking practice, and AI feedback.",
  path: "/exams/telc",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
