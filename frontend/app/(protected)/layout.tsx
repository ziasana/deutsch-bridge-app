import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProtectedShell from "./ProtectedShell";

// Everything behind the login (dashboard, admin, profile...) must stay out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
