"use client";

import { CornerDownLeft, Plus, Search, Tags } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Modal, ModalContent, ModalDescription, ModalTitle, toast } from "@/components/ui/overlays";
import { createItem, type Item, ItemTypeBadge, normalize, quickSearch } from "@/features/items/client";
import {
  getModuleByType,
  MODULE_ICONS,
  MODULES,
  NAV_ICONS,
  OPEN_CAPTURE_EVENT,
  PRIMARY_NAV,
} from "@/features/shell";
import { cn } from "@quickadui/utils";
import { type Capture, detectCapture } from "../detect-type";
import { isTypingTarget, isPaletteShortcut } from "../shortcuts";
import { ShortcutsHelp } from "./ShortcutsHelp";

type Option = {
  id: string;
  group: "Créer" | "Aller à" | "Éléments";
  label: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  run: () => void;
};

const NAV_TARGETS = [
  ...PRIMARY_NAV.map(({ href, label }) => ({ href, label, Icon: NAV_ICONS[href]! })),
  ...MODULES.map(({ slug, label }) => ({ href: `/${slug}`, label, Icon: MODULE_ICONS[slug] })),
  { href: "/tags", label: "Tags", Icon: Tags },
];

const SEARCH_DELAY_MS = 150;

/**
 * Palette globale (Ctrl/Cmd+K) : un champ unique pour capturer (type
 * détecté), naviguer et retrouver un élément. Entièrement au clavier.
 */
export function CommandPalette() {
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();
  const searchSeq = useRef(0);

  // Raccourcis globaux
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isPaletteShortcut(event)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "?" && !isTypingTarget(event.target) && !open) {
        event.preventDefault();
        setHelpOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_CAPTURE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_CAPTURE_EVENT, onOpen);
    };
  }, [open]);

  // Recherche d'éléments, avec anti-rebond et réponses obsolètes ignorées
  useEffect(() => {
    const value = query.trim();
    const seq = ++searchSeq.current;
    if (value.length < 2) return;
    const timer = setTimeout(async () => {
      const result = await quickSearch(value);
      if (seq === searchSeq.current) setResults(result.ok ? result.data : []);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const capture = detectCapture(query);
  const visibleResults = query.trim().length < 2 ? [] : results;

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
  };

  const options = useMemo<Option[]>(() => {
    const needle = normalize(query);
    const navOptions: Option[] = NAV_TARGETS.filter(
      (target) => !needle || normalize(target.label).includes(needle),
    ).map((target) => ({
      id: `nav:${target.href}`,
      group: "Aller à",
      label: target.label,
      icon: <target.Icon />,
      run: () => {
        close();
        router.push(target.href);
      },
    }));

    // « inbox » + Entrée doit ouvrir l'Inbox, pas créer une note « inbox » :
    // une page dont le nom correspond exactement passe avant la capture.
    const exact = NAV_TARGETS.some((target) => needle && normalize(target.label) === needle);
    const list: Option[] = [];
    if (capture && !exact) list.push(captureOption(capture));
    list.push(...navOptions);
    if (capture && exact) list.push(captureOption(capture));
    for (const item of visibleResults) {
      list.push({
        id: `item:${item.id}`,
        group: "Éléments",
        label: item.title,
        hint: <ItemTypeBadge type={item.type} />,
        icon: <Search />,
        run: () => {
          close();
          router.push(`/${getModuleByType(item.type).slug}?item=${item.id}`);
        },
      });
    }
    return list;
    // close/router sont stables pour l'usage qui en est fait ici
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, visibleResults]);

  function captureOption(detected: Capture): Option {
    const definition = getModuleByType(detected.type);
    return {
      id: "capture",
      group: "Créer",
      label: (
        <span className="truncate">
          {definition.itemLabel} : <span className="font-medium text-neutral-12">{detected.title}</span>
        </span>
      ),
      hint: <ItemTypeBadge type={detected.type} />,
      icon: <Plus />,
      run: () =>
        startTransition(async () => {
          const result = await createItem({
            type: detected.type,
            title: detected.title,
            body: detected.body,
            // Les repos gardent l'URL dans le contenu tant que leur module n'est pas fait.
            ...(detected.type === "link" ? { url: detected.url } : {}),
          });
          if (!result.ok) {
            toast({ title: result.error, variant: "danger" });
            return;
          }
          close();
          toast({ title: `${definition.itemLabel} ajouté·e à l'Inbox` });
          router.push(`/${definition.slug}?item=${result.data.id}`);
        }),
    };
  }

  const current = Math.min(active, Math.max(options.length - 1, 0));

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current + step + options.length) % Math.max(options.length, 1));
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isPending) options[current]?.run();
    }
  };

  let lastGroup: Option["group"] | null = null;

  return (
    <>
      <Modal open={open} onOpenChange={(value) => (value ? setOpen(true) : close())}>
        <ModalContent className="top-[15%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
          <ModalTitle className="sr-only">Capturer ou rechercher</ModalTitle>
          <ModalDescription className="sr-only">
            Tape une URL, une URL GitHub ou du texte puis Entrée pour capturer, ou cherche une page ou un élément.
          </ModalDescription>
          <div className="flex items-center gap-3 border-b border-neutral-6 px-4">
            <Search className="size-4 shrink-0 text-neutral-11" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="URL, idée, ou page à ouvrir…"
              aria-label="Capturer ou rechercher"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={options[current] ? `${listId}-${current}` : undefined}
              aria-autocomplete="list"
              maxLength={2000}
              className="h-12 w-full bg-transparent text-sm text-neutral-12 outline-none placeholder:text-neutral-11"
            />
          </div>
          <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-96 overflow-y-auto p-2">
            {options.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-11">Aucun résultat</li>}
            {options.map((option, index) => {
              const header = option.group !== lastGroup ? option.group : null;
              lastGroup = option.group;
              return (
                <li key={option.id} role="presentation">
                  {header && (
                    <div role="presentation" className="px-3 pt-2 pb-1 text-xs font-medium text-neutral-11">
                      {header}
                    </div>
                  )}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === current}
                    onMouseMove={() => setActive(index)}
                    onClick={() => option.run()}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-12 [&_svg]:size-4 [&_svg]:shrink-0",
                      index === current && "bg-neutral-3",
                    )}
                  >
                    <span className="text-neutral-11">{option.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.hint}
                    {index === current && <CornerDownLeft className="text-neutral-11" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-neutral-6 px-4 py-2 text-xs text-neutral-11">
            <span>↑↓ pour choisir · Entrée pour valider · Échap pour fermer</span>
            {isPending && <span role="status">Création…</span>}
          </div>
        </ModalContent>
      </Modal>
      <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
