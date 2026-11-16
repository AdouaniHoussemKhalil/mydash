"use client";

import { Layers, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/core";
import { toast } from "@/components/ui/overlays";
import { addItemToSpace, removeItemFromSpace } from "../actions";
import type { Space } from "../schemas";
import { SpaceIcon } from "./SpaceIcon";

export type ItemSpacesEditorProps = {
  itemId: string;
  spaces: Space[];
  allSpaces: Space[];
};

/** Un item peut appartenir à plusieurs Espaces. Le ranger le sort de l'Inbox. */
export function ItemSpacesEditor({ itemId, spaces: initial, allSpaces }: ItemSpacesEditorProps) {
  const [spaces, setSpaces] = useState(initial);
  const [, startTransition] = useTransition();
  const available = allSpaces.filter((space) => !spaces.some((s) => s.id === space.id));

  const mutate = (next: Space[], action: () => Promise<{ ok: boolean; error?: string }>) => {
    const previous = spaces;
    setSpaces(next);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setSpaces(previous);
        toast({ title: result.error ?? "Erreur", variant: "danger" });
      }
    });
  };

  return (
    <section aria-label="Espaces" className="flex flex-col gap-2">
      <h4 className="flex items-center gap-1.5 text-xs font-medium text-neutral-11">
        <Layers className="size-3.5" aria-hidden /> Espaces
      </h4>
      <ul className="flex flex-wrap gap-1.5">
        {spaces.map((space) => (
          <li
            key={space.id}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-6 py-0.5 pr-1 pl-2 text-xs [&_svg]:size-3"
          >
            <SpaceIcon space={space} />
            <Link href={`/spaces/${space.id}`} className="max-w-40 truncate hover:underline">
              {space.name}
            </Link>
            <button
              type="button"
              aria-label={`Retirer de l'Espace ${space.name}`}
              onClick={() =>
                mutate(
                  spaces.filter((s) => s.id !== space.id),
                  () => removeItemFromSpace(itemId, space.id),
                )
              }
              className="rounded p-0.5 text-neutral-11 hover:bg-neutral-4 hover:text-neutral-12"
            >
              <X />
            </button>
          </li>
        ))}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" disabled={allSpaces.length === 0}>
                <Plus className="size-3" />
                {allSpaces.length === 0 ? "Crée d'abord un Espace" : "Ajouter à un Espace"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {available.length === 0 && <DropdownMenuItem disabled>Déjà dans tous les Espaces</DropdownMenuItem>}
              {available.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onSelect={() => mutate([...spaces, space], () => addItemToSpace(itemId, space.id))}
                  className="[&_svg]:size-4"
                >
                  <SpaceIcon space={space} />
                  {space.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </section>
  );
}
