import { CircleAlert, CircleCheck, CircleX, Info, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

const icons: Record<string, React.ReactNode> = {
  info: <Info className="size-5 text-info" aria-hidden="true" />,
  success: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
  warning: <CircleAlert className="size-5 text-warning" aria-hidden="true" />,
  error: <CircleX className="size-5 text-destructive" aria-hidden="true" />,
};

const tints: Record<string, string> = {
  info: 'border-info/30 bg-info/5',
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  error: 'border-destructive/30 bg-destructive/5',
};

export type NotificationProps = {
  notification: {
    id: string;
    type: keyof typeof icons;
    title: string;
    message?: string;
  };
  onDismiss: (id: string) => void;
};

export const Notification = ({
  notification: { id, type, title, message },
  onDismiss,
}: NotificationProps) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), 5000);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto w-full max-w-sm animate-fade-in rounded-lg border bg-card shadow-lg',
        tints[type],
      )}
    >
      <div className="flex items-start p-4">
        <div className="shrink-0">{icons[type]}</div>
        <div className="ms-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        <div className="ms-4 flex shrink-0">
          <button
            type="button"
            aria-label={t('actions.close')}
            className="inline-flex rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            onClick={() => {
              onDismiss(id);
            }}
          >
            <span className="sr-only">{t('actions.close')}</span>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
