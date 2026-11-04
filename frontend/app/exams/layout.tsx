import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "German Exams: telc and DTZ",
  description: "Compare the telc and DTZ German exams and choose the right one. Format, levels, sections and how DeutschCertify prepares you.",
  path: "/exams",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
