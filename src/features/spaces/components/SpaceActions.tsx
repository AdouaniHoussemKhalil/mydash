"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from "@/components/ui/overlays";
import { deleteSpace } from "../actions";
import type { Space } from "../schemas";
import { SpaceFormModal } from "./SpaceFormModal";

/** Renommer / supprimer un Espace depuis sa page. */
export function SpaceActions({ space }: { space: Space }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteSpace(space.id);
      if (!result.ok) {
        toast({ title: result.error, variant: "danger" });
        return;
      }
      setConfirming(false);
      toast({ title: "Espace supprimé" });
      router.push("/today");
    });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="size-4" /> Modifier
      </Button>
      <Button variant="ghost" size="sm" className="text-danger-11" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" /> Supprimer
      </Button>

      <SpaceFormModal space={space} open={editing} onOpenChange={setEditing} />
      <Modal open={confirming} onOpenChange={setConfirming}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer l&apos;Espace « {space.name} » ?</ModalTitle>
            <ModalDescription>Ses éléments sont conservés : ils sont seulement retirés de cet Espace.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={remove} disabled={isPending}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
