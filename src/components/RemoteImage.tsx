"use client";

import { useState } from "react";

export type RemoteImageProps = {
  src: string;
  /** Texte alternatif ; vide pour une image décorative. */
  alt?: string | undefined;
  className?: string | undefined;
};

/**
 * Image d'un site tiers (aperçu de lien, favicon) : chargée sans référent,
 * en différé, et masquée si elle ne se charge pas.
 */
export function RemoteImage({ src, alt = "", className }: RemoteImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;
  return (
    // Domaines arbitraires : next/image exigerait de les déclarer un à un.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
