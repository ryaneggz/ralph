"use client";

import { useRouter } from "next/navigation";
import { IacVersionHistory } from "@/components/iac-version-history";

interface IacVersionHistoryWrapperProps {
  projectId: string;
}

export function IacVersionHistoryWrapper({
  projectId,
}: IacVersionHistoryWrapperProps) {
  const router = useRouter();

  return (
    <IacVersionHistory
      projectId={projectId}
      onRestore={() => {
        router.refresh();
      }}
    />
  );
}
