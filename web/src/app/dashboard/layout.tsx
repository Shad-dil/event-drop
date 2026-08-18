"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/require-auth";
import { useCurrentUser, useLogout } from "@/lib/hooks/useAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/login");
  }

  return (
    <RequireAuth>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">
            📸 EventDrop
          </Link>
          <div className="flex items-center gap-4">
            {user?.email && <span className="text-sm text-muted-foreground">{user.email}</span>}
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6">{children}</main>
      </div>
    </RequireAuth>
  );
}
