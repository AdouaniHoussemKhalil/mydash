import { ShieldCheck, SquareTerminal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TOOL_ICONS, TOOLS } from "@/features/toolbox";

export const metadata: Metadata = { title: "Boîte à outils" };

export default function ToolboxPage() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <PageHeader title="Boîte à outils" description="Outils de développeur, aussi accessibles avec Ctrl+K." icon={<SquareTerminal />} />
        <p className="flex items-center gap-2 text-sm text-neutral-11">
          <ShieldCheck className="size-4 shrink-0 text-success-11" aria-hidden />
          Tout se passe dans ton navigateur : rien n&apos;est envoyé au serveur ni conservé.
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.slug];
            return (
              <li key={tool.slug}>
                <Link
                  href={`/toolbox/${tool.slug}`}
                  className="flex h-full items-start gap-3 rounded-lg border border-neutral-6 p-4 transition-colors hover:border-neutral-8 hover:bg-neutral-2 focus-visible:outline-2 focus-visible:outline-accent-8"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-3 text-accent-11 [&_svg]:size-5">
                    <Icon aria-hidden />
                  </span>
                  <span>
                    <span className="block font-medium text-neutral-12">{tool.name}</span>
                    <span className="block text-sm text-neutral-11">{tool.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
