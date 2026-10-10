import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

import { Button, type ButtonProps } from './button';

export const RetryButton = ({
  onClick,
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => {
  const [rotating, setRotating] = useState(false);
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setRotating(false), 650);
    return () => window.clearTimeout(timer);
  }, [rotating]);
  return (
    <Button
      {...props}
      className={cn('h-11', className)}
      disabled={disabled || isLoading || rotating}
      aria-busy={isLoading || rotating}
      icon={
        <RefreshCw
          className={cn(
            'size-4',
            (isLoading || rotating) &&
              'animate-spin motion-reduce:animate-none',
          )}
          aria-hidden
        />
      }
      onClick={(event) => {
        setRotating(true);
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
};
