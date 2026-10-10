import { Link as RouterLink, LinkProps } from 'react-router';

import { cn } from '@/utils/cn';

export const Link = ({ className, children, ...props }: LinkProps) => {
  return (
    <RouterLink
      className={cn('text-link underline-offset-4 hover:underline', className)}
      {...props}
    >
      {children}
    </RouterLink>
  );
};
