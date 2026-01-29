import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/user-menu";

export default async function InboxPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Ralph Orchestrator</h1>
        <UserMenu />
      </header>
      <main className="p-6">
        <p className="text-muted-foreground">Welcome to your inbox.</p>
      </main>
    </div>
  );
}
