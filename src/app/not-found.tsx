import Link from "next/link";
import { Button } from "@/components/ui/core";
import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <EmptyState
        title="Page introuvable"
        description="Cette page n'existe pas ou a été déplacée."
        action={
          <Button asChild>
            <Link href="/today">Retour à Aujourd&apos;hui</Link>
          </Button>
        }
      />
    </main>
  );
}
