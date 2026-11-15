"use client";

import type { ComponentType } from "react";
import type { ToolSlug } from "../tools";
import { Base64Tool } from "./Base64Tool";
import { CronTool } from "./CronTool";
import { JsonTool } from "./JsonTool";
import { JwtTool } from "./JwtTool";
import { TimestampTool } from "./TimestampTool";
import { UrlTool } from "./UrlTool";
import { UuidTool } from "./UuidTool";

const TOOL_COMPONENTS: Record<ToolSlug, ComponentType> = {
  json: JsonTool,
  base64: Base64Tool,
  url: UrlTool,
  jwt: JwtTool,
  timestamp: TimestampTool,
  uuid: UuidTool,
  cron: CronTool,
};

/** Outil affiché selon son slug (l'état n'est jamais conservé entre visites). */
export function ToolView({ slug }: { slug: ToolSlug }) {
  const Tool = TOOL_COMPONENTS[slug];
  return <Tool />;
}
