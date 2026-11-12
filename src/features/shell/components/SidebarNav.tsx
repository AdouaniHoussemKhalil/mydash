"use client";

import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode, Suspense } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarNavItem,
  useSidebar,
} from "@/components/ui/shell";
import { Tags } from "lucide-react";
import { MODULE_ICONS, NAV_ICONS } from "../icons";
import { MODULES, PRIMARY_NAV } from "../modules";

type NavLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  onNavigate?: (() => void) | undefined;
};

/**
 * Le chemin courant est une donnée d'URL : avec Cache Components, il doit
 * être lu derrière <Suspense>. Le repli est le même lien, sans état actif,
 * ce qui garde la sidebar dans le shell statique.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<NavLinkItem {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink(props: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === props.href || pathname.startsWith(`${props.href}/`);
  return <NavLinkItem {...props} active={active} />;
}

/**
 * SidebarNavItem rend un <a> sans asChild : on garde un vrai lien (clic
 * molette, Ctrl+clic) et on route côté client pour un clic simple.
 */
function NavLinkItem({ href, label, icon, onNavigate, active }: NavLinkProps & { active: boolean }) {
  const router = useRouter();
  const { collapsed } = useSidebar();

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
  /** Liste des Espaces (rendue côté serveur). */
  spaces?: ReactNode;
  /** Appelé après une navigation (ferme le tiroir mobile). */
  onNavigate?: (() => void) | undefined;
};

export function SidebarNav({ onNavigate, spaces }: SidebarNavProps) {
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
        {spaces}
      </SidebarGroup>

      <SidebarGroup>
        <NavLink href="/tags" label="Tags" icon={<Tags />} onNavigate={onNavigate} />
      </SidebarGroup>
    </SidebarContent>
  );
}

