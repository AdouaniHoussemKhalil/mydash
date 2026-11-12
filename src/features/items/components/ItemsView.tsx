import { Pin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data";
import type { ViewMode } from "@/features/shell";
import { excerpt, formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@quickadui/utils";
import type { Item } from "../schemas";
import { ItemTypeBadge } from "./ItemTypeBadge";

export type ItemsViewProps = {
  items: Item[];
  view: ViewMode;
  selectedId?: string | undefined;
  /** Affiché quand la liste est vide. */
  empty: ReactNode;
  /** Afficher le type (pages multi-types : Aujourd'hui, Inbox…). */
  showType?: boolean | undefined;
};

function detailHref(view: ViewMode, id: string) {
  const params = new URLSearchParams({ item: id });
  if (view !== "list") params.set("view", view);
  return `?${params.toString()}`;
}

function Updated({ date }: { date: string }) {
  return (
    <time dateTime={date} title={formatDateTime(date)} className="shrink-0 text-xs text-neutral-11">
      {formatRelative(date)}
    </time>
  );
}

function PinMark({ pinned }: { pinned: boolean }) {
  if (!pinned) return null;
  return <Pin className="size-3.5 shrink-0 text-accent-11" aria-label="Épinglé" />;
}

export function ItemsView({ items, view, selectedId, empty, showType = false }: ItemsViewProps) {
  if (items.length === 0) return <>{empty}</>;

  if (view === "cards") {
    return (
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={detailHref(view, item.id)} scroll={false} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-accent-8">
              <Card
                className={cn(
                  "h-full transition-colors hover:border-neutral-8",
                  item.id === selectedId && "border-accent-8",
                )}
              >
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {showType ? <ItemTypeBadge type={item.type} /> : <span />}
                    <PinMark pinned={item.pinned} />
                  </div>
                  <CardTitle className="line-clamp-2 text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {item.body && <p className="line-clamp-3 text-sm text-neutral-11">{excerpt(item.body)}</p>}
                  <Updated date={item.updated_at} />
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (view === "table") {
    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="text-right">Modifié</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} selected={item.id === selectedId}>
                <TableCell className="max-w-0 w-full">
                  <Link href={detailHref(view, item.id)} scroll={false} className="flex items-center gap-2 font-medium text-neutral-12 hover:underline">
                    <PinMark pinned={item.pinned} />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <ItemTypeBadge type={item.type} />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Updated date={item.updated_at} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={detailHref(view, item.id)}
            scroll={false}
            aria-current={item.id === selectedId ? "true" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-8",
              item.id === selectedId && "bg-accent-2",
            )}
          >
            <PinMark pinned={item.pinned} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-neutral-12">{item.title}</p>
              {item.body && <p className="truncate text-sm text-neutral-11">{excerpt(item.body, 120)}</p>}
            </div>
            {showType && (
              <span className="hidden sm:inline-flex">
                <ItemTypeBadge type={item.type} />
              </span>
            )}
            <Updated date={item.updated_at} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
