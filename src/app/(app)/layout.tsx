import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { getCurrentUser, signOut } from "@/features/auth";
import { AccountMenu, AppShell } from "@/features/shell";
import { listSpaces, SpacesNav } from "@/features/spaces";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      // Données par utilisateur : lues à la requête, le reste du shell reste statique.
      account={
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <Account />
        </Suspense>
      }
      spaces={
        <Suspense fallback={<Skeleton className="mx-3 h-8" />}>
          <Spaces />
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

async function Spaces() {
  const spaces = await listSpaces();
  return <SpacesNav spaces={spaces} />;
}
