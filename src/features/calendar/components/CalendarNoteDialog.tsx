"use client";

import { Trash2 } from "lucide-react";
import { type FormEvent, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, toast } from "@/components/ui/overlays";
import { addCalendarNote, deleteCalendarNote, updateCalendarNote } from "../actions";
import { CALENDAR_NOTE_MAX, type CalendarNote, noteTextSchema } from "../schemas";

const dayFormat = new Intl.DateTimeFormat("fr", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** « jeudi 12 novembre » pour un jour « AAAA-MM-JJ ». */
export function formatDay(day: string): string {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

export type CalendarNoteDialogProps = {
  /** Ajout dans ce jour, ou modification de cette note. */
  target: { mode: "add"; day: string } | { mode: "edit"; note: CalendarNote } | null;
  onClose: () => void;
};

/** Petite fenêtre : écrire, modifier ou supprimer une note du calendrier. */
export function CalendarNoteDialog({ target, onClose }: CalendarNoteDialogProps) {
  return (
    <Modal open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        {/* Monté avec une clé : le champ repart de la bonne valeur à chaque ouverture. */}
        {target && <NoteForm key={target.mode === "add" ? `add-${target.day}` : target.note.id} target={target} onClose={onClose} />}
      </ModalContent>
    </Modal>
  );
}

function NoteForm({ target, onClose }: { target: NonNullable<CalendarNoteDialogProps["target"]>; onClose: () => void }) {
  const [text, setText] = useState(target.mode === "edit" ? target.note.text : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();
  const day = target.mode === "add" ? target.day : target.note.day;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = noteTextSchema.safeParse(text);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Texte invalide");
      return;
    }
    startTransition(async () => {
      const result =
        target.mode === "add" ? await addCalendarNote(target.day, parsed.data) : await updateCalendarNote(target.note.id, parsed.data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast({ title: target.mode === "add" ? "Note ajoutée" : "Note modifiée" });
      onClose();
    });
  };

  const remove = () => {
    if (target.mode !== "edit") return;
    startTransition(async () => {
      const result = await deleteCalendarNote(target.note.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast({ title: "Note supprimée" });
      onClose();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <ModalHeader>
        <ModalTitle>{target.mode === "add" ? "Nouvelle note" : "Modifier la note"}</ModalTitle>
        <ModalDescription className="first-letter:uppercase">{formatDay(day)}</ModalDescription>
      </ModalHeader>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="sr-only">
          Note
        </label>
        <Input
          id={inputId}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Ex. Appeler le comptable"
          maxLength={CALENDAR_NOTE_MAX}
          autoFocus
          aria-invalid={error ? true : undefined}
        />
        {error && (
          <p role="alert" className="text-sm text-danger-11">
            {error}
          </p>
        )}
      </div>
      <ModalFooter className="flex-wrap">
        {target.mode === "edit" && (
          <Button type="button" variant="ghost" className="mr-auto text-danger-11" onClick={remove} disabled={isPending}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {target.mode === "add" ? "Ajouter" : "Enregistrer"}
        </Button>
      </ModalFooter>
    </form>
  );
}
