"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Old query-string URL (/learn/grammar/lesson?id=...) kept working for existing links and shares: forwards to the path URL. */
function Redirect() {
  const router = useRouter();
  const value = useSearchParams().get("id");

  useEffect(() => {
    router.replace(value ? `/learn/grammar/${encodeURIComponent(value)}` : "/learn/grammar");
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
