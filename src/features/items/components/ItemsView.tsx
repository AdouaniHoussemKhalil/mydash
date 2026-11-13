import { ExternalLink, Paperclip, Pin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle, IconButton } from "@/components/ui/core";
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
import { displayHost } from "@/lib/url";
import { cn } from "@quickadui/utils";
import { RemoteImage } from "@/components/RemoteImage";
import { fileKindLabel, formatBytes } from "@/features/files";
import { type Item, isRead } from "../schemas";
import { ItemTypeBadge } from "./ItemTypeBadge";
import { TaskMeta } from "./TaskMeta";

export type ItemsViewProps = {
  items: Item[];
  view: ViewMode;
  selectedId?: string | undefined;
  /** Affiché quand la liste est vide. */
  empty: ReactNode;
  /** Afficher le type (pages multi-types : Aujourd'hui, Inbox…). */
  showType?: boolean | undefined;
  /** Paramètres d'URL à conserver dans les liens (ex. archived=1). */
  linkParams?: Record<string, string> | undefined;
};

function detailHref(view: ViewMode, id: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ ...extra, item: id });
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

/** Sous-titre : type et taille d'un fichier, site d'un lien, sinon extrait du contenu. */
function subtitle(item: Item, length?: number) {
  const file = item.type === "file" ? item.item_files[0] : undefined;
  if (file) return `${fileKindLabel(file.name, file.mime_type)} · ${formatBytes(file.size_bytes)}`;
  if (item.url) return item.link_meta?.site_name ?? displayHost(item.url) ?? item.url;
  return item.body ? excerpt(item.body, length) : null;
}

/** Favicon du site (liens), à la place du repère d'épinglage absent. */
function Favicon({ item }: { item: Item }) {
  const src = item.url ? item.link_meta?.favicon_url : null;
  if (!src) return null;
  return <RemoteImage src={src} className="size-4 shrink-0 rounded-sm" />;
}

/** Ouvre le site dans un nouvel onglet (hors du lien vers le détail). */
function OpenSite({ item, className }: { item: Item; className?: string | undefined }) {
  if (!item.url) return null;
  return (
    <IconButton asChild variant="ghost" size="sm" aria-label={`Ouvrir ${displayHost(item.url) ?? "le site"} dans un nouvel onglet`} className={className}>
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="size-4" />
      </a>
    </IconButton>
  );
}

/** Nombre de pièces jointes (hors module Fichiers, où le fichier est l'élément). */
function Attachments({ item }: { item: Item }) {
  const count = item.type === "file" ? item.item_files.length - 1 : item.item_files.length;
  if (count <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-neutral-11" title={`${count} fichier(s) joint(s)`}>
      <Paperclip className="size-3.5" aria-hidden />
      {count}
      <span className="sr-only"> fichier(s) joint(s)</span>
    </span>
  );
}

function Task({ item }: { item: Item }) {
  if (item.type !== "task") return null;
  return <TaskMeta status={item.task_details?.status ?? "todo"} dueDate={item.task_details?.due_date ?? null} />;
}

function ToRead({ item }: { item: Item }) {
  if (item.type !== "link" || isRead(item)) return null;
  return (
    <Badge variant="soft" className="shrink-0">
      À lire
    </Badge>
  );
}

export function ItemsView({ items, view, selectedId, empty, showType = false, linkParams }: ItemsViewProps) {
  const href = (id: string) => detailHref(view, id, linkParams);
  if (items.length === 0) return <>{empty}</>;

  if (view === "cards") {
    return (
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <Link href={href(item.id)} scroll={false} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-accent-8">
              <Card
                className={cn(
                  "h-full overflow-hidden transition-colors hover:border-neutral-8",
                  item.id === selectedId && "border-accent-8",
                )}
              >
                {item.url && item.link_meta?.image_url && (
                  <RemoteImage src={item.link_meta.image_url} className="h-32 w-full object-cover" />
                )}
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {showType ? <ItemTypeBadge type={item.type} /> : <span />}
                    <span className="flex items-center gap-2">
                      <Attachments item={item} />
                      <ToRead item={item} />
                      <Task item={item} />
                      <PinMark pinned={item.pinned} />
                    </span>
                  </div>
                  <CardTitle className="flex items-start gap-2 text-base">
                    <span className="mt-1 empty:hidden">
                      <Favicon item={item} />
                    </span>
                    <span className="line-clamp-2">{item.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {item.url && item.link_meta?.description && (
                    <p className="line-clamp-3 text-sm text-neutral-11">{item.link_meta.description}</p>
                  )}
                  {subtitle(item) && <p className="line-clamp-3 text-sm break-words text-neutral-11">{subtitle(item)}</p>}
                  <Updated date={item.updated_at} />
                </CardContent>
              </Card>
            </Link>
            <OpenSite item={item} className="absolute right-3 bottom-3" />
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
                  <div className="flex items-center gap-2">
                    <Link href={href(item.id)} scroll={false} className="flex min-w-0 items-center gap-2 font-medium text-neutral-12 hover:underline">
                      <PinMark pinned={item.pinned} />
                      <Favicon item={item} />
                      <span className="truncate">{item.title}</span>
                    </Link>
                    <Attachments item={item} />
                    <ToRead item={item} />
                    <Task item={item} />
                    <OpenSite item={item} />
                  </div>
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
        <li
          key={item.id}
          className={cn("flex items-center transition-colors hover:bg-neutral-2", item.id === selectedId && "bg-accent-2")}
        >
          <Link
            href={href(item.id)}
            scroll={false}
            aria-current={item.id === selectedId ? "true" : undefined}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-8"
          >
            <PinMark pinned={item.pinned} />
            <Favicon item={item} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-neutral-12">{item.title}</p>
              {subtitle(item, 120) && <p className="truncate text-sm text-neutral-11">{subtitle(item, 120)}</p>}
            </div>
            <Attachments item={item} />
            <ToRead item={item} />
            <Task item={item} />
            {showType && (
              <span className="hidden sm:inline-flex">
                <ItemTypeBadge type={item.type} />
              </span>
            )}
            <Updated date={item.updated_at} />
          </Link>
          <OpenSite item={item} className="mr-2" />
        </li>
      ))}
    </ul>
  );
}
