"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/core";
import { EmptyState } from "@/components/EmptyState";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
      <EmptyState
        title="Une erreur est survenue"
        description="Le contenu n'a pas pu être chargé. Réessaie dans un instant."
        action={<Button onClick={reset}>Réessayer</Button>}
      />
    </main>
  );
}
