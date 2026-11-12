export { AccountMenu } from "./components/AccountMenu";
export { AppShell } from "./components/AppShell";
export { CollectionView, type CollectionViewProps } from "./components/CollectionView";
export { DetailPanel } from "./components/DetailPanel";
export { NavLink } from "./components/SidebarNav";
export { OPEN_CAPTURE_EVENT } from "./events";
export { MODULE_ICONS, NAV_ICONS } from "./icons";
export {
  getModule,
  getModuleByType,
  type ItemType,
  MODULES,
  type ModuleDef,
  type ModuleSlug,
  PRIMARY_NAV,
} from "./modules";
export { parseView, VIEW_LABELS, VIEW_MODES, type ViewMode, withSearchParams } from "./views";
export { useSidebar } from "@/components/ui/shell";
