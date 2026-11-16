"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/core";

/** Ouvre l'impression du navigateur : « Enregistrer au format PDF ». */
export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Download className="size-4" />
      Télécharger en PDF
    </Button>
  );
}
