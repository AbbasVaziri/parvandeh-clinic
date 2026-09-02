import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center " +
        (className ?? "")
      }
    >
      <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}