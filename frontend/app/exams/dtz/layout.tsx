import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "DTZ German Exam Preparation",
  description: "Prepare for the DTZ (Deutsch-Test für Zuwanderer) with realistic mock tests and practice for every section of the exam.",
  path: "/exams/dtz",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
