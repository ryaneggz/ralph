import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LastProjectRedirect } from "@/components/last-project-redirect";

export default async function InboxPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell>
      <LastProjectRedirect />
      <div className="p-6">
        <p className="text-muted-foreground">Welcome to your inbox.</p>
      </div>
    </AppShell>
  );
}
