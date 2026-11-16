import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui/core";
import { LoginForm, safeNextPath } from "@/features/auth";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>MyDash</CardTitle>
          <CardDescription>Connecte-toi pour retrouver tout ton espace.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Les paramètres d'URL sont lus à la requête : rendu en streaming */}
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <LoginFormFromParams searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function LoginFormFromParams({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return <LoginForm next={safeNextPath(first(params.next))} errorCode={first(params.error)} />;
}
