/**
 * Envoi direct du navigateur vers une URL signée Storage, avec progression
 * (fetch ne la fournit pas pour l'envoi : XMLHttpRequest).
 */
export function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(xhr.status === 413 ? "Fichier trop volumineux : 50 Mo maximum" : "Envoi refusé"));
      }
    };
    xhr.onerror = () => reject(new Error("Connexion interrompue pendant l'envoi"));
    xhr.onabort = () => reject(new Error("Envoi annulé"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
