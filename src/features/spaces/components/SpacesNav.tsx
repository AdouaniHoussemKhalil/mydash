"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { NavLink, useSidebar } from "@/features/shell";
import type { Space } from "../schemas";
import { SpaceFormModal } from "./SpaceFormModal";
import { SpaceIcon } from "./SpaceIcon";

export function SpacesNav({ spaces }: { spaces: Space[] }) {
  const { collapsed } = useSidebar();
  const [creating, setCreating] = useState(false);

  return (
    <>
      {spaces.map((space) => (
        <NavLink key={space.id} href={`/spaces/${space.id}`} label={space.name} icon={<SpaceIcon space={space} />} />
      ))}
      {spaces.length === 0 && !collapsed && (
        <p className="px-3 py-1 text-xs text-neutral-11">Aucun Espace pour l&apos;instant.</p>
      )}
      <button
        type="button"
        onClick={() => setCreating(true)}
        title={collapsed ? "Nouvel Espace" : undefined}
        aria-label="Nouvel Espace"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-11 hover:bg-neutral-3 hover:text-neutral-12 [&_svg]:size-4"
      >
        <Plus aria-hidden />
        {!collapsed && "Nouvel Espace"}
      </button>
      <SpaceFormModal open={creating} onOpenChange={setCreating} />
    </>
  );
}
