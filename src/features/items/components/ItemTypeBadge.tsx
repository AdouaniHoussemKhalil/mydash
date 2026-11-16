import { Badge } from "@/components/ui/core";
import { getModuleByType, MODULE_ICONS } from "@/features/shell";
import type { Item } from "../schemas";

export function ItemTypeBadge({ type }: { type: Item["type"] }) {
  const definition = getModuleByType(type);
  const Icon = MODULE_ICONS[definition.slug as keyof typeof MODULE_ICONS];
  return (
    <Badge variant="soft" className="gap-1">
      <Icon className="size-3" aria-hidden />
      {definition.itemLabel}
    </Badge>
  );
}
