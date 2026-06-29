import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      {icon === undefined ? null : <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description === undefined ? null : (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action === undefined ? null : <div className="mt-5">{action}</div>}
    </div>
  );
}
