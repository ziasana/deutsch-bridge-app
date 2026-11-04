import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Contact",
  description: "Questions about DeutschCertify or your German exam preparation? Get in touch with our team.",
  path: "/contact",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
