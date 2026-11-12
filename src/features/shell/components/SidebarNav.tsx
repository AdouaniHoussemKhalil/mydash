"use client";

import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarNavItem,
  useSidebar,
} from "@/components/ui/shell";
import { MODULE_ICONS, NAV_ICONS } from "../icons";
import { MODULES, PRIMARY_NAV } from "../modules";

type NavLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  onNavigate?: (() => void) | undefined;
};

/**
 * SidebarNavItem rend un <a> sans asChild : on garde un vrai lien (clic
 * molette, Ctrl+clic) et on route côté client pour un clic simple.
 */
function NavLink({ href, label, icon, onNavigate }: NavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    router.push(href);
    onNavigate?.();
  };

  return (
    <SidebarNavItem
      href={href}
      active={active}
      icon={icon}
      onClick={handleClick}
      onMouseEnter={() => router.prefetch(href)}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      {label}
    </SidebarNavItem>
  );
}

export type SidebarNavProps = {
  /** Appelé après une navigation (ferme le tiroir mobile). */
  onNavigate?: (() => void) | undefined;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <SidebarContent aria-label="Navigation principale" className="gap-4">
      <SidebarGroup>
        {PRIMARY_NAV.map(({ href, label }) => {
          const Icon = NAV_ICONS[href]!;
          return <NavLink key={href} href={href} label={label} icon={<Icon />} onNavigate={onNavigate} />;
        })}
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Modules</SidebarGroupLabel>
        {MODULES.map(({ slug, label }) => {
          const Icon = MODULE_ICONS[slug];
          return (
            <NavLink key={slug} href={`/${slug}`} label={label} icon={<Icon />} onNavigate={onNavigate} />
          );
        })}
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Espaces</SidebarGroupLabel>
        <SpacesPlaceholder />
      </SidebarGroup>
    </SidebarContent>
  );
}

function SpacesPlaceholder() {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return <p className="px-3 py-1 text-xs text-neutral-11">Aucun espace pour l&apos;instant.</p>;
}
