import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { getCurrentUser, signOut } from "@/features/auth";
import { AccountMenu, AppShell } from "@/features/shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      account={
        // La session est lue à la requête : le reste du shell reste statique.
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <Account />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function Account() {
  const user = await getCurrentUser();
  return <AccountMenu email={user.email} signOutAction={signOut} />;
}
