import type { ReactNode } from "react";
import { cn } from "@quickadui/utils";

export type EmptyStateProps = {
  title: string;
  description?: string | undefined;
  icon?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-6 px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="text-neutral-9 [&_svg]:size-8">{icon}</div>}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-neutral-12">{title}</p>
        {description && <p className="max-w-sm text-sm text-neutral-11">{description}</p>}
      </div>
      {action}
    </div>
  );
}
