import {
  CircleAlert,
  CircleCheck,
  Info,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type BannerVariant =
  'info' | 'warning' | 'destructive' | 'success' | 'stale' | 'window-closed';

const variantClasses: Record<BannerVariant, string> = {
  info: 'border-info/30 bg-info/5',
  warning: 'border-warning/30 bg-warning/5',
  destructive: 'border-destructive/30 bg-destructive/5',
  success: 'border-success/30 bg-success/5',
  stale: 'border-warning/30 bg-warning/5',
  'window-closed': 'border-border bg-muted',
};

const icons: Record<BannerVariant, React.ReactNode> = {
  info: <Info className="size-5 text-info" aria-hidden />,
  warning: <TriangleAlert className="size-5 text-warning" aria-hidden />,
  destructive: <CircleAlert className="size-5 text-destructive" aria-hidden />,
  success: <CircleCheck className="size-5 text-success" aria-hidden />,
  stale: <RefreshCw className="size-5 text-warning" aria-hidden />,
  'window-closed': (
    <CircleAlert className="size-5 text-muted-foreground" aria-hidden />
  ),
};

export type BannerProps = {
  variant?: BannerVariant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export const Banner = ({
  variant = 'info',
  title,
  children,
  action,
  className,
}: BannerProps) => {
  const isError = variant === 'destructive';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        variantClasses[variant],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-medium">{title}</p>}
        {children && (
          <div className={cn('text-sm text-muted-foreground', title && 'mt-1')}>
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  requestId?: string | null;
  compact?: boolean;
};

export const ErrorState = ({
  title,
  message,
  onRetry,
  requestId,
  compact = false,
}: ErrorStateProps) => {
  const { t } = useTranslation();
  const body = message ?? t('errors.loadFailedBody');

  return (
    <Banner
      variant="destructive"
      title={title ?? t('errors.loadFailed')}
      action={
        onRetry && (
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className="h-11"
            onClick={onRetry}
          >
            {t('actions.retry')}
          </Button>
        )
      }
      className={compact ? 'p-3' : undefined}
    >
      <p>{body}</p>
      {requestId && (
        <p className="mt-1 text-2xs text-muted-foreground">
          {t('errors.requestRef', { id: requestId })}
        </p>
      )}
    </Banner>
  );
};
