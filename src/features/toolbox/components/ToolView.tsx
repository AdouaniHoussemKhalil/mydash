"use client";

import type { ComponentType } from "react";
import type { ToolSlug } from "../tools";
import { Base64Tool } from "./Base64Tool";
import { JsonTool } from "./JsonTool";
import { UrlTool } from "./UrlTool";

const TOOL_COMPONENTS: Record<ToolSlug, ComponentType> = {
  json: JsonTool,
  base64: Base64Tool,
  url: UrlTool,
};

/** Outil affiché selon son slug (l'état n'est jamais conservé entre visites). */
export function ToolView({ slug }: { slug: ToolSlug }) {
  const Tool = TOOL_COMPONENTS[slug];
  return <Tool />;
}
