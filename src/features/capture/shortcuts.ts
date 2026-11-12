/** Ctrl+K (Windows/Linux) ou Cmd+K (macOS), sans autre modificateur. */
export function isPaletteShortcut(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">) {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k";
}

/** Vrai si la frappe vise un champ de saisie (les raccourcis à une touche s'effacent). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return Boolean((target as Element).closest("input, textarea, select, [contenteditable=''], [contenteditable=true]"));
}

export const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["Ctrl", "K"], description: "Ouvrir la palette : capturer, aller à, retrouver" },
  { keys: ["↑", "↓", "Entrée"], description: "Choisir et valider dans la palette" },
  { keys: ["Échap"], description: "Quitter le champ, puis fermer le détail ou la palette" },
  { keys: ["Entrée"], description: "Dans le titre d'un élément : passer au contenu" },
  { keys: ["?"], description: "Afficher cette aide" },
];
