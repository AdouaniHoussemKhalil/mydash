import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  description?: string | undefined;
  icon?: ReactNode | undefined;
  actions?: ReactNode | undefined;
};

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-1 text-neutral-11 [&_svg]:size-5">{icon}</div>}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-neutral-12">{title}</h1>
          {description && <p className="text-sm text-neutral-11">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
