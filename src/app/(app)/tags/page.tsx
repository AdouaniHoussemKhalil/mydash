import { Tags } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { PageHeader } from "@/components/PageHeader";
import { listTags, TagsManager } from "@/features/tags";

export const metadata: Metadata = { title: "Tags" };

export default function TagsPage() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 md:px-6">
        <PageHeader
          title="Tags"
          description="Renomme, colore ou supprime tes tags. Noms uniques, sans tenir compte des majuscules."
          icon={<Tags />}
        />
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <TagsList />
        </Suspense>
      </div>
    </main>
  );
}

async function TagsList() {
  const tags = await listTags();
  return <TagsManager tags={tags} />;
}
