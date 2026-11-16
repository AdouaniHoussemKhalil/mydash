import { prepareFileUpload, registerFile } from "./actions";
import { uploadWithProgress } from "./upload";

/** Envoie un fichier pour un item : URL signée → envoi direct à Storage → enregistrement. */
export async function sendFile(itemId: string, file: File, onProgress: (ratio: number) => void) {
  const info = { name: file.name, size: file.size, mimeType: file.type };
  const prepared = await prepareFileUpload(itemId, info);
  if (!prepared.ok) throw new Error(prepared.error);
  await uploadWithProgress(prepared.data.signedUrl, file, onProgress);
  const registered = await registerFile(itemId, prepared.data.fileId, info);
  if (!registered.ok) throw new Error(registered.error);
}
