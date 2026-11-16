import { describe, expect, it } from "vitest";
import { isPaletteShortcut, isTypingTarget } from "./shortcuts";

const key = (init: Partial<KeyboardEvent>) => ({
  key: "k",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...init,
});

describe("isPaletteShortcut", () => {
  it("Ctrl+K et Cmd+K", () => {
    expect(isPaletteShortcut(key({ ctrlKey: true }))).toBe(true);
    expect(isPaletteShortcut(key({ metaKey: true, key: "K" }))).toBe(true);
  });

  it("ignore K seul et les combinaisons avec Alt / Maj", () => {
    expect(isPaletteShortcut(key({}))).toBe(false);
    expect(isPaletteShortcut(key({ ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isPaletteShortcut(key({ ctrlKey: true, altKey: true }))).toBe(false);
  });
});

describe("isTypingTarget", () => {
  it("détecte les champs de saisie", () => {
    const input = document.createElement("input");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const span = document.createElement("span");
    editable.appendChild(span);
    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(span)).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
