import { Suspense } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui/core";
import { getCurrentUser, signOut } from "@/features/auth";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>MyDash</CardTitle>
          <CardDescription>
            Fondations en place. Le shell applicatif arrive avec la suite de la Phase 0.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <Account />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function Account() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="truncate text-sm text-neutral-11">
        Connecté : <span className="text-neutral-12">{user.email ?? "compte GitHub"}</span>
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}
