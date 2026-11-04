"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Old query-string URL (/blog/post?slug=...) kept working for existing links and shares: forwards to the path URL. */
function Redirect() {
  const router = useRouter();
  const value = useSearchParams().get("slug");

  useEffect(() => {
    router.replace(value ? `/blog/${encodeURIComponent(value)}` : "/blog");
  }, [router, value]);

  return null;
}

export default function LegacyPage() {
  return (
    <Suspense fallback={null}>
      <Redirect />
    </Suspense>
  );
}
