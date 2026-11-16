"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Input, Label } from "@/components/ui/forms";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/overlays";
import { SwatchPicker } from "@/components/SwatchPicker";
import { createSpace, updateSpace } from "../actions";
import type { Space } from "../schemas";

export type SpaceFormModalProps = {
  /** Absent = création. */
  space?: Space | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SpaceFormModal({ space, open, onOpenChange }: SpaceFormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        {/* Monté à l'ouverture : le formulaire repart des valeurs de l'Espace. */}
        {open && <SpaceForm space={space} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Modal>
  );
}

function SpaceForm({ space, onDone }: { space?: Space | undefined; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(space?.name ?? "");
  const [icon, setIcon] = useState(space?.icon ?? "");
  const [color, setColor] = useState<string | null>(space?.color ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const values = { name, icon, color };
      if (space) {
        const result = await updateSpace(space.id, values);
        if (!result.ok) return setError(result.error);
        onDone();
      } else {
        const result = await createSpace(values);
        if (!result.ok) return setError(result.error);
        onDone();
        router.push(`/spaces/${result.data.id}`);
      }
    });
  };

  const field = (id: string, label: string, control: ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {control}
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <ModalHeader>
        <ModalTitle>{space ? "Modifier l'Espace" : "Nouvel Espace"}</ModalTitle>
        <ModalDescription>Un Espace regroupe des éléments de tous types autour d&apos;un projet.</ModalDescription>
      </ModalHeader>
      {field(
        "space-name",
        "Nom",
        <Input id="space-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus required />,
      )}
      {field(
        "space-icon",
        "Icône (emoji, facultatif)",
        <Input id="space-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={8} placeholder="🚀" className="w-24" />,
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-12">Couleur</span>
        <SwatchPicker value={color} onChange={setColor} label="Couleur de l'Espace" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger-11">
          {error}
        </p>
      )}
      <ModalFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {space ? "Enregistrer" : "Créer"}
        </Button>
      </ModalFooter>
    </form>
  );
}
