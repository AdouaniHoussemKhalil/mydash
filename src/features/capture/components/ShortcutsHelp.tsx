"use client";

import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from "@/components/ui/overlays";
import { SHORTCUTS } from "../shortcuts";

export function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Raccourcis clavier</ModalTitle>
          <ModalDescription>Sur macOS, Cmd remplace Ctrl.</ModalDescription>
        </ModalHeader>
        <dl className="flex flex-col gap-2">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-neutral-11">{description}</dt>
              <dd className="flex shrink-0 gap-1">
                {keys.map((k) => (
                  <kbd key={k} className="rounded border border-neutral-6 bg-neutral-2 px-1.5 py-0.5 font-mono text-xs text-neutral-12">
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </ModalContent>
    </Modal>
  );
}
