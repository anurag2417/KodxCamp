import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
    {icon && <div className="mb-4 text-brand-500">{icon}</div>}
    <h3 className="text-base font-semibold text-text-primary">{title}</h3>
    {description && (
      <p className="mt-1 max-w-md text-sm text-text-muted">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
