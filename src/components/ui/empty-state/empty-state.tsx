import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import * as React from 'react';

import { Button, RetryButton } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    retry?: boolean;
  };
  compact?: boolean;
  className?: string;
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) => {
  const ActionButton = action?.retry ? RetryButton : Button;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed bg-card text-center',
        compact ? 'gap-2 p-6' : 'gap-3 p-10',
        className,
      )}
    >
      <Icon
        className={cn('text-muted-foreground', compact ? 'size-5' : 'size-6')}
        aria-hidden
      />
      {compact ? (
        <p className="text-sm font-medium">{title}</p>
      ) : (
        <h2 className="text-lg font-semibold">{title}</h2>
      )}
      {description && (
        <p className="max-w-prose text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <ActionButton
          className="mt-2 h-11"
          variant={compact ? 'outline' : 'default'}
          onClick={action.onClick}
          isLoading={action.loading}
          disabled={action.loading}
          aria-busy={action.loading}
        >
          {action.label}
        </ActionButton>
      )}
    </div>
  );
};
