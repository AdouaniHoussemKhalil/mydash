"use client";

import type { ComponentType } from "react";
import type { ToolSlug } from "../tools";
import { Base64Tool } from "./Base64Tool";
import { CronTool } from "./CronTool";
import { DiffTool } from "./DiffTool";
import { HashTool } from "./HashTool";
import { JsonTool } from "./JsonTool";
import { JwtTool } from "./JwtTool";
import { TimestampTool } from "./TimestampTool";
import { UrlTool } from "./UrlTool";
import { UuidTool } from "./UuidTool";

/** Outils purement navigateur (le presse-papiers partagé est chargé côté serveur). */
export type BrowserToolSlug = Exclude<ToolSlug, "clipboard">;

const TOOL_COMPONENTS: Record<BrowserToolSlug, ComponentType> = {
  json: JsonTool,
  base64: Base64Tool,
  url: UrlTool,
  jwt: JwtTool,
  timestamp: TimestampTool,
  uuid: UuidTool,
  cron: CronTool,
  diff: DiffTool,
  hash: HashTool,
};

/** Outil affiché selon son slug (l'état n'est jamais conservé entre visites). */
export function ToolView({ slug }: { slug: BrowserToolSlug }) {
  const Tool = TOOL_COMPONENTS[slug];
  return <Tool />;
}
