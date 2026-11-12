"use client";

import { Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
import { withSearchParams } from "@/features/shell";
import { deleteItem } from "../actions";

export function DeleteItemButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteItem(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast({ title: "Élément supprimé" });
      router.replace(`${pathname}${withSearchParams(window.location.search, { item: null })}`, {
        scroll: false,
      });
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-danger-11">
        <Trash2 className="size-4" />
        Supprimer
      </Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer cet élément ?</ModalTitle>
            <ModalDescription>
              « {title} » sera supprimé définitivement, avec ses tags et ses liens.
            </ModalDescription>
          </ModalHeader>
          {error && (
            <p role="alert" className="text-sm text-danger-11">
              {error}
            </p>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={isPending}>
              {isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
