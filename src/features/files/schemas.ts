import { z } from "zod";
import type { Tables } from "@/lib/supabase/database.types";

export const FILES_BUCKET = "files";
/** 50 Mo, comme la limite de l'espace de stockage. */
export const FILE_MAX_BYTES = 50 * 1024 * 1024;
export const FILE_NAME_MAX = 255;

export type ItemFile = Pick<
  Tables<"item_files">,
  "id" | "item_id" | "name" | "mime_type" | "size_bytes" | "storage_path" | "created_at"
>;

export const ITEM_FILE_COLUMNS = "id, item_id, name, mime_type, size_bytes, storage_path, created_at" as const;

export const fileIdSchema = z.uuid("Fichier introuvable");

/** Nom affiché : sans chemin ni caractères de contrôle, longueur bornée. */
export const fileNameSchema = z
  .string()
  .transform((name) => name.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f]/g, "").trim())
  .pipe(z.string().min(1, "Nom de fichier vide").max(FILE_NAME_MAX, `${FILE_NAME_MAX} caractères maximum`));

/** Description d'un fichier avant envoi (ce que le navigateur annonce). */
export const fileInfoSchema = z.object({
  name: fileNameSchema,
  size: z
    .number()
    .int()
    .min(0)
    .max(FILE_MAX_BYTES, "Fichier trop volumineux : 50 Mo maximum"),
  mimeType: z
    .string()
    .max(255)
    .transform((type) => (/^[\w.+-]+\/[\w.+-]+$/.test(type) ? type.toLowerCase() : "application/octet-stream")),
});
export type FileInfo = z.input<typeof fileInfoSchema>;

/** Chemin de stockage : <workspace>/<item>/<uuid>. */
export function storagePath(workspaceId: string, itemId: string, fileId: string) {
  return `${workspaceId}/${itemId}/${fileId}`;
}

/** Lien stable vers un fichier (redirige vers une URL signée fraîche). */
export function fileHref(fileId: string, download = false) {
  return `/api/files/${fileId}${download ? "?download=1" : ""}`;
}

/** Taille lisible : « 12 Ko », « 3,4 Mo ». */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = value < 10 ? 1 : 0;
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: digits })} ${units[unit]}`;
}

/** Libellé court du type : « PDF », « Image PNG », « Texte », sinon l'extension. */
export function fileKindLabel(name: string, mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  const [family, subtype = ""] = mimeType.split("/");
  if (family === "image") return `Image ${subtype.replace(/\+.*$/, "").toUpperCase()}`;
  if (family === "video") return "Vidéo";
  if (family === "audio") return "Audio";
  const extension = /\.([a-z0-9]{1,8})$/i.exec(name)?.[1];
  if (extension) return extension.toUpperCase();
  return family === "text" ? "Texte" : "Fichier";
}

/**
 * Le navigateur sait l'afficher sans risque dans un onglet : images
 * matricielles, PDF, texte brut, audio, vidéo. Pas de HTML ni de SVG
 * (contenu actif servi par le domaine de stockage).
 */
export function canOpenInBrowser(mimeType: string): boolean {
  if (previewKind(mimeType)) return true;
  if (/^(audio|video)\/[\w.+-]+$/.test(mimeType)) return true;
  return /^text\/(plain|markdown|csv|x-markdown)$/.test(mimeType) || mimeType === "application/json";
}

/** Aperçu possible dans le navigateur. */
export function previewKind(mimeType: string): "image" | "pdf" | null {
  if (/^image\/(png|jpe?g|gif|webp|avif|bmp)$/.test(mimeType)) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return null;
}
