"use client";

import { Trash2 } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
import { Button, IconButton, Popover, PopoverContent, PopoverTrigger } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from "@/components/ui/overlays";
import { ColorDot } from "@/components/ColorDot";
import { EmptyState } from "@/components/EmptyState";
import { SwatchPicker } from "@/components/SwatchPicker";
import { createTag, deleteTag, updateTag } from "../actions";
import type { Tag } from "../schemas";

/** Page de gestion : créer, renommer, colorer, supprimer les tags. */
export function TagsManager({ tags }: { tags: Tag[] }) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const create = (event: FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTag({ name });
      if (!result.ok) return void toast({ title: result.error, variant: "danger" });
      setName("");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={create} className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nouveau tag"
          aria-label="Nom du nouveau tag"
          maxLength={50}
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !name.trim()}>
          Créer
        </Button>
      </form>

      {tags.length === 0 ? (
        <EmptyState title="Aucun tag" description="Crée un tag ici ou directement depuis le détail d'un élément." />
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6">
          {tags.map((tag) => (
            <TagRow key={`${tag.id}-${tag.name}-${tag.color}`} tag={tag} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TagRow({ tag }: { tag: Tag }) {
  const [name, setName] = useState(tag.name);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = (patch: { name?: string; color?: string | null }) =>
    startTransition(async () => {
      const result = await updateTag(tag.id, patch);
      if (!result.ok) {
        setName(tag.name);
        toast({ title: result.error, variant: "danger" });
      }
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deleteTag(tag.id);
      if (!result.ok) return void toast({ title: result.error, variant: "danger" });
      setConfirming(false);
      toast({ title: `Tag « ${tag.name} » supprimé` });
    });

  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`Couleur du tag ${tag.name}`} className="rounded-full p-1.5 hover:bg-neutral-3">
            <ColorDot color={tag.color} className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <SwatchPicker value={tag.color} onChange={(color) => save({ color })} label={`Couleur du tag ${tag.name}`} />
        </PopoverContent>
      </Popover>
      <Input
        inputSize="sm"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => name.trim() && name.trim() !== tag.name && save({ name })}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        aria-label={`Renommer le tag ${tag.name}`}
        maxLength={50}
        disabled={isPending}
        className="border-transparent shadow-none hover:border-neutral-6"
      />
      <IconButton variant="ghost" size="sm" aria-label={`Supprimer le tag ${tag.name}`} onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" />
      </IconButton>
      <Modal open={confirming} onOpenChange={setConfirming}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le tag « {tag.name} » ?</ModalTitle>
            <ModalDescription>Il sera retiré de tous les éléments qui le portent.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={remove} disabled={isPending}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </li>
  );
}
