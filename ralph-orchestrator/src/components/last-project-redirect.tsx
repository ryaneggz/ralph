"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLastProjectId } from "@/components/sidebar";

export function LastProjectRedirect() {
  const router = useRouter();

  useEffect(() => {
    const lastId = getLastProjectId();
    if (lastId) {
      router.replace(`/projects/${lastId}`);
    }
  }, [router]);

  return null;
}
