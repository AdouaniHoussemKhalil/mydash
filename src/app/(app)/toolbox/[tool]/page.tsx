import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { PageHeader } from "@/components/PageHeader";
import { getTool, TOOL_ICONS, TOOLS, ToolView } from "@/features/toolbox";

export function generateStaticParams() {
  return TOOLS.map(({ slug }) => ({ tool: slug }));
}

export async function generateMetadata({ params }: PageProps<"/toolbox/[tool]">): Promise<Metadata> {
  const { tool } = await params;
  return { title: getTool(tool)?.name ?? "Outil introuvable" };
}

// params lu sous Suspense : la coquille de la page ne dépend pas de l'URL.
export default function ToolPage({ params }: PageProps<"/toolbox/[tool]">) {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
        <Link href="/toolbox" className="inline-flex items-center gap-1.5 self-start text-sm text-neutral-11 hover:text-neutral-12">
          <ArrowLeft className="size-4" aria-hidden />
          Boîte à outils
        </Link>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <Tool params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Tool({ params }: Pick<PageProps<"/toolbox/[tool]">, "params">) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const Icon = TOOL_ICONS[tool.slug];
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} icon={<Icon />} />
      <ToolView slug={tool.slug} />
    </>
  );
}
