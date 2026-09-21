import React from 'react';
import { cn } from '@/shared/lib/utils';

interface Props {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const AdminTable: React.FC<Props> = ({ headers, children, className }) => (
  <div className={cn('w-full overflow-x-auto rounded-xl border border-border bg-surface', className)}>
    <table className="w-full text-sm">
      <thead className="bg-surface-secondary">
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">{children}</tbody>
    </table>
  </div>
);
